import { GastosModel, TotalGastosMesModel, CategoriasModel, UsuarioModel } from "../../database/models/index.js";
import { sequelize } from "../../database/sequelize.js";
import { Op, QueryTypes } from "sequelize";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";
import { CartaoCreditoModel } from "../../database/models/index.js";

export default class GastoMesRepository {
  constructor() {}

  // 1. Configurar Limite (Upsert)
  async configGastoLimiteMes(id_usuario, dadosMes, connection) {
    console.log("GastoMesRepository.configGastoLimiteMes chamado com:", { id_usuario, dadosMes });
    try {
      const { ano, mes, limiteGastoMes } = dadosMes;

      // Usando UPSERT do Sequelize (compatível com MySQL 'ON DUPLICATE KEY UPDATE')
      await TotalGastosMesModel.upsert({
        id_usuario: id_usuario,
        ano: Number(ano),
        mes: Number(mes),
        limiteGastoMes: Number(limiteGastoMes),
      }, { transaction: connection });

      return {
        mensagem: "Configuração mensal salva com sucesso.",
        id_usuario: Number(id_usuario),
        ano: Number(ano),
        mes: Number(mes),
        limite_gasto_mes: Number(limiteGastoMes)
      };
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 2. Obter Limite
  async getLimiteGastosMes(id_usuario, ano, mes) {
    try {
      const resultado = await TotalGastosMesModel.findOne({
        where: { id_usuario: id_usuario, ano, mes },
        raw: true
      });
      console.log("getLimiteGastosMesRows: ", resultado);
      // Retorna array para manter compatibilidade com código antigo que espera rows[0]
      return resultado ? [resultado] : [];
    } catch (error) {
      console.error("Erro no GastoMesRepository.getLimiteGastosMes:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async atualizarLimite(id_usuario, limite_gasto_mes, connection) {
    try {
      const [affectedRows] = await TotalGastosMesModel.update(
        { limiteGastoMes: limite_gasto_mes },
        { 
          where: { id_usuario: id_usuario },
          transaction: connection
        }
      );
      return { mensagem: "Limite atualizado com sucesso.", result: { affectedRows } };
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 4. Recalcular Gasto Atual do Mês (Completo)
  async recalcularGastoAtualMes(id_usuario, ano, mes, connection) {
    try {
      // Passo 1: Calcular soma na tabela de gastos
      const soma = await GastosModel.sum('valor', {
        where: {
          id_usuario: id_usuario,
          [Op.and]: [
            sequelize.where(sequelize.fn('YEAR', sequelize.col('data_gasto')), ano),
            sequelize.where(sequelize.fn('MONTH', sequelize.col('data_gasto')), mes)
          ]
        },
        transaction: connection
      });

      const valorTotal = soma || 0;

      // Passo 2: Atualizar tabela de totais
      await TotalGastosMesModel.update(
        { gastoAtualMes: valorTotal },
        {
          where: { idUsuario: id_usuario, ano, mes },
          transaction: connection
        }
      );

      return {
        mensagem: "Gasto atual do mês recalculado.",
        ano,
        mes,
        result: { gastoAtualMes: valorTotal }
      };
    } catch (error) {
      console.error("Erro no GastoMesRepository.recalcularGastoAtualMes:", error.message);
      throw error;
    }
  }

  // 5. Relatório de Gastos por Categoria
  async getGastosTotaisPorCategoria({ idUsuario, inicio, fim }) {
    console.log("idUsuario no repository: ", idUsuario);
    try {
      const whereClause = { id_usuario: idUsuario };
      if (inicio && fim) {
        whereClause.data_gasto = { [Op.between]: [inicio, fim] };
      }

      const gastos = await GastosModel.findAll({
        attributes: [
          ['id_gasto', 'id_gasto'], // Aliases para manter compatibilidade exata
          [sequelize.fn('DATE_FORMAT', sequelize.col('data_gasto'), '%Y-%m-%d'), 'data_gasto'],
          ['valor', 'valor'],
          ['descricao', 'descricao']
        ],
        include: [{
          model: CategoriasModel,
          as: 'categoria',
          attributes: [['id_categoria', 'id_categoria'], ['nome', 'nomeCategoria']],
          required: true // Inner Join
        }],
        where: whereClause,
        order: [
          [{ model: CategoriasModel, as: 'categoria' }, 'nome', 'ASC'],
          ['data_gasto', 'ASC'], // Sequelize usa o nome do atributo do model no order
          ['id_gasto', 'ASC']
        ],
        raw: true,
        nest: true
      });

      // Achata o objeto aninhado para o formato plano esperado
      return gastos.map(g => ({
        id_categoria: g.categoria.id_categoria,
        nomeCategoria: g.categoria.nomeCategoria,
        id_gasto: g.id_gasto,
        data_gasto: g.data_gasto,
        valor: g.valor,
        descricao: g.descricao || ''
      }));

    } catch (error) {
      console.error("Erro getGastosTotaisPorCategoria:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 6. Adicionar Gasto
  async addGasto(gastos, id_usuario, connection) {
    console.log("Gastos recebidos no repository:", gastos);
    try {
      const novoGasto = await GastosModel.create({
        id_categoria: gastos.id_categoria,
        id_usuario: id_usuario,
        valor: gastos.valor,
        data_gasto: gastos.data_gasto,
        descricao: gastos.descricao || null,
        forma_pagamento: gastos.forma_pagamento || 'DEBITO',
        origem_lancamento: gastos.origem_lancamento || "manual",
        id_cartao: gastos.id_cartao || null
      }, { transaction: connection });

      return {
        mensagem: "Gasto adicionado com sucesso.",
        id_gasto: novoGasto.idGasto // Retorna ID gerado
      };
    } catch (error) {
      console.error("Erro addGasto:", error);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async getSaldoAtual(id_usuario, connection) {
    try {
      // Usa UsuarioModel para buscar saldo
      const usuario = await UsuarioModel.findByPk(id_usuario, {
        attributes: ['saldoAtual'],
        transaction: connection
      });
      return usuario ? Number(usuario.saldoAtual) : 0;
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 8. Incrementar Gasto Atual Mês (Helper para os Listeners)
 async incrementarGastoAtualMes({ id_usuario, data_gasto, valor, connection }) {
    const dateObj = new Date(data_gasto);
    const ano = dateObj.getFullYear();
    const mes = dateObj.getMonth() + 1;

    try {
      // Tenta atualizar primeiro (mais comum)
      const [affectedRows] = await TotalGastosMesModel.increment(
        { gastoAtualMes: Number(valor) },
        { 
          where: { id_usuario, ano, mes },
          transaction: connection
        }
      );

      // Se não atualizou nada, é porque não existe. Cria o registro.
      // O 'increment' do Sequelize retorna [[instancia, rows], affectedCount] dependendo do dialeto,
      // mas para update puro, verificar se o registro existe antes é mais seguro se o increment falhar.
      
      // Abordagem mais robusta: SQL Raw para Upsert (Insert ou Update)
      // Isso resolve garantido o problema de concorrência e transação
      const sql = `
        INSERT INTO total_gastos_mes (id_usuario, ano, mes, limite_gasto_mes, gasto_atual_mes, created_at, updated_at)
        VALUES (:id_usuario, :ano, :mes, 0.00, :valor, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          gasto_atual_mes = gasto_atual_mes + :valor,
          updated_at = CURRENT_TIMESTAMP;
      `;

      await sequelize.query(sql, {
        replacements: {
          id_usuario,
          ano,
          mes,
          valor: Number(valor)
        },
        transaction: connection
      });

      return { mensagem: "Gasto do mês incrementado com sucesso." };
    } catch (error) {
      console.error("Erro incrementarGastoAtualMes:", error.message);
      // ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }
}