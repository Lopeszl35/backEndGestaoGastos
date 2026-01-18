import { GastosFixosModel } from "../../database/models/index.js";
import { sequelize } from "../../database/sequelize.js"; // Import direto
import { Op, QueryTypes } from "sequelize";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";

export default class GastosFixosRepository {
  constructor() {
    // Não precisa mais de this.database injetado
  }

  async obterResumoGastosFixos(id_usuario) {
    try {
      const sqlTotais = `
        SELECT
          ROUND(SUM(
            CASE recorrencia
              WHEN 'mensal' THEN valor
              WHEN 'bimestral' THEN valor / 2
              WHEN 'trimestral' THEN valor / 3
              WHEN 'anual' THEN valor / 12
              ELSE valor
            END
          ), 2) AS totalMensal,
          ROUND(SUM(
            CASE recorrencia
              WHEN 'mensal' THEN valor * 12
              WHEN 'bimestral' THEN valor * 6
              WHEN 'trimestral' THEN valor * 4
              WHEN 'anual' THEN valor
              ELSE valor * 12
            END
          ), 2) AS totalAnual
        FROM gastos_fixos
        WHERE id_usuario = :id_usuario
          AND ativo = 1;
      `;

      const sqlProximos7Dias = `
        SELECT
          ROUND(SUM(x.valor), 2) AS total,
          COUNT(*) AS quantidade
        FROM (
          SELECT
            valor,
            CASE
              WHEN dia_vencimento >= DAY(CURDATE())
                THEN DATE_ADD(
                  DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                  INTERVAL (LEAST(dia_vencimento, DAY(LAST_DAY(CURDATE()))) - 1) DAY
                )
              ELSE DATE_ADD(
                DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
                INTERVAL (
                  LEAST(
                    dia_vencimento,
                    DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)))
                  ) - 1
                ) DAY
              )
            END AS proximo_vencimento
          FROM gastos_fixos
          WHERE id_usuario = :id_usuario
            AND ativo = 1
        ) x
        WHERE x.proximo_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);
      `;

      // Executa em paralelo
      const [resultTotais, resultProximos] = await Promise.all([
        sequelize.query(sqlTotais, {
          replacements: { id_usuario },
          type: QueryTypes.SELECT
        }),
        sequelize.query(sqlProximos7Dias, {
          replacements: { id_usuario },
          type: QueryTypes.SELECT
        })
      ]);

      const rowTotais = resultTotais[0] || {};
      const rowProximos = resultProximos[0] || {};

      return {
        totalMensal: Number(rowTotais.totalMensal ?? 0),
        totalAnual: Number(rowTotais.totalAnual ?? 0),
        proximos7Dias: {
          total: Number(rowProximos.total ?? 0),
          quantidade: Number(rowProximos.quantidade ?? 0),
        },
      };
    } catch (error) {
      console.error("Erro no GastosFixosRepository.obterResumoGastosFixos:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async inserirGastoFixo(dadosGastoFixo, id_usuario) { // Assinatura mantida, mas id_usuario pode vir no objeto
    try {
        // Garante que o ID do usuário está no payload
        const payload = { ...dadosGastoFixo, idUsuario: id_usuario };
        
        const novoGasto = await GastosFixosModel.create(payload);
        
        return {
            mensagem: "Gasto fixo criado com sucesso.",
            id_gasto_fixo: novoGasto.idGastoFixo,
        };
    } catch (error) {
      console.error("Erro no GastosFixosRepository.inserirGastoFixo:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async listarGastosFixos(id_usuario, opts = {}) {
    try {
      const somenteAtivos = opts?.somenteAtivos === true;
      const whereClause = { idUsuario: id_usuario };
      if (somenteAtivos) {
          whereClause.ativo = 1;
      }

      // Usando Sequelize para listagem simples com ordenação
      // Para o campo calculado 'categoria_exibicao', usamos attributes com literal
      const gastos = await GastosFixosModel.findAll({
          attributes: [
              'idGastoFixo',
              'tipo',
              [sequelize.literal(`CASE 
                  WHEN tipo IN ('luz','agua','telefone') THEN 'Utilidades' 
                  WHEN tipo IN ('internet','assinatura') THEN 'Assinaturas' 
                  ELSE 'Outros' 
               END`), 'categoria_exibicao'],
              'titulo',
              'descricao',
              'valor',
              'diaVencimento',
              'recorrencia',
              'ativo'
          ],
          where: whereClause,
          order: [
              ['ativo', 'DESC'],
              ['diaVencimento', 'ASC'],
              ['titulo', 'ASC']
          ],
          raw: true // Retorna objetos planos
      });

      // Mapeamento para snake_case para manter compatibilidade com o front
      return gastos.map(g => ({
          id_gasto_fixo: g.idGastoFixo,
          tipo: g.tipo,
          categoria_exibicao: g.categoria_exibicao,
          titulo: g.titulo,
          descricao: g.descricao,
          valor: g.valor,
          dia_vencimento: g.diaVencimento,
          recorrencia: g.recorrencia,
          ativo: g.ativo
      }));

    } catch (error) {
      console.error("Erro no GastosFixosRepository.listarGastosFixos:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async buscarGastoFixoPorIdEUsuario(id_gasto_fixo, id_usuario) {
    try {
      const gasto = await GastosFixosModel.findOne({
          where: { idGastoFixo: id_gasto_fixo, idUsuario: id_usuario },
          attributes: ['idGastoFixo', 'idUsuario', 'ativo'],
          raw: true
      });
      
      if (gasto) {
          // Mapeia para snake_case se necessário pelo service
          return {
              id_gasto_fixo: gasto.idGastoFixo,
              id_usuario: gasto.idUsuario,
              ativo: gasto.ativo
          };
      }
      return null;
    } catch (error) {
      console.error("Erro no GastosFixosRepository.buscarGastoFixoPorIdEUsuario:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async atualizarAtivoGastoFixo(id_gasto_fixo, id_usuario, ativo) {
    try {
      const [affectedRows] = await GastosFixosModel.update(
          { ativo: Number(ativo) },
          { where: { idGastoFixo: id_gasto_fixo, idUsuario: id_usuario } }
      );
      return { affectedRows };
    } catch (error) {
      console.error("Erro no GastosFixosRepository.atualizarAtivoGastoFixo:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async obterGastosFixosPorCategoria(id_usuario) {
    try {
      // Query agregada complexa com GROUP BY e CASE - Melhor manter raw
      const sql = `
        SELECT
          CASE
            WHEN tipo IN ('luz','agua','telefone') THEN 'Utilidades'
            WHEN tipo IN ('internet','assinatura') THEN 'Assinaturas'
            ELSE 'Outros'
          END AS categoria,
          ROUND(SUM(
            CASE recorrencia
              WHEN 'mensal' THEN valor
              WHEN 'bimestral' THEN valor / 2
              WHEN 'trimestral' THEN valor / 3
              WHEN 'anual' THEN valor / 12
              ELSE valor
            END
          ), 2) AS total
        FROM gastos_fixos
        WHERE id_usuario = :id_usuario
          AND ativo = 1
        GROUP BY categoria
        ORDER BY total DESC;
      `;

      const rows = await sequelize.query(sql, {
          replacements: { id_usuario },
          type: QueryTypes.SELECT
      });
      return rows;
    } catch (error) {
      console.error("Erro no GastosFixosRepository.obterGastosFixosPorCategoria:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }
}