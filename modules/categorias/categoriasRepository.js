
import { QueryTypes, Op } from "sequelize";

export default class CategoriasRepository {
  constructor(database) {
    this.sequelize = database.sequelize;
    this.CategoriasModel = database.CategoriasModel;
  }

  // TODO: "Refatorar para método no repository não retornar mensagens de sucesso/falha, apenas dados puros ou lançar erros. A lógica de mensagens deve ficar na camada de serviço ou controller."
  async createCategoria(categoria, nomeNormalizado, id_usuario, transaction) {
      const novaCategoria = await this.CategoriasModel.create(
        {
          idUsuario: id_usuario,
          nome: categoria.nome,
          nome_normalizado: nomeNormalizado,
          limite: categoria.limite,
          ativo: true,
        },
        { transaction }
      );

      if (novaCategoria) {
        return {
          mensagem: "Categoria criada com sucesso.",
          id_categoria: novaCategoria.idCategoria,
        };
      } else {
        return {
          mensagem: "Falha ao criar categoria.",
          code: "FALHA_CRIACAO_CATEGORIA",
        };
      }
  }

  async checkCategoriaExists(nomeCategoria, id_usuario, transaction) {
      // CORREÇÃO: Usar Op.and importado do pacote, e não sequelize.Op.and
      const count = await this.CategoriasModel.count({
        where: {
          idUsuario: id_usuario,
          ativo: true, // Importante: Verifica apenas categorias ATIVAS
          [Op.and]: this.sequelize.where(
            this.sequelize.fn("LOWER", this.sequelize.fn("TRIM", this.sequelize.col("nome"))),
            this.sequelize.fn("LOWER", this.sequelize.fn("TRIM", nomeCategoria))
          ),
        },
        transaction,
      });

      return count > 0;
  }

  async getCategoriasAtivas(id_usuario, ano, mes) {
    // 1. Iniciamos a query base (Obrigatória para ambos os cenários)
    let sql = `
      SELECT 
        cg.id_categoria,
        cg.nome,
        cg.limite,
        cg.ativo,
        COALESCE(SUM(g.valor), 0) AS totalGastoCategoriaMes,
        CASE
          WHEN cg.limite IS NULL OR cg.limite = 0 THEN NULL
          ELSE ROUND((COALESCE(SUM(g.valor), 0) / cg.limite) * 100, 2)
        END AS percentualGastoCategoriaMes
      FROM categorias_gastos cg
      LEFT JOIN gastos g
        ON g.id_categoria = cg.id_categoria
        AND g.id_usuario = cg.id_usuario
    `;

    // 2. Definimos os replacements base
    const replacements = { id_usuario };

    // 🛡️ DYNAMIC SQL: Injetamos as cláusulas de data APENAS se o Front-end pedir.
    // Isso resolve o problema de tela de "Vida Inteira" vs "Mês Atual".
    if (ano) {
      sql += ` AND YEAR(g.data_gasto) = :ano`;
      replacements.ano = ano;
    }
    
    if (mes) {
      sql += ` AND MONTH(g.data_gasto) = :mes`;
      replacements.mes = mes;
    }

    // 3. Fechamos a query com as regras de agrupamento
    sql += `
      WHERE cg.id_usuario = :id_usuario
        AND cg.ativo = 1
      GROUP BY cg.id_categoria, cg.nome, cg.limite, cg.ativo
      ORDER BY cg.nome ASC;
    `;

      const result = await this.sequelize.query(sql, {
        replacements, // O objeto se moldou perfeitamente ao que a string exige
        type: QueryTypes.SELECT,
      });
      return result;
  }

  async updateCategoria(id_categoria, id_usuario, categoria, transaction) {
      const [affectedRows] = await this.CategoriasModel.update(
        {
          nome: categoria.nome,
          limite: categoria.limite,
        },
        {
          where: { idCategoria: id_categoria, idUsuario: id_usuario },
          transaction,
        }
      );
      return { affectedRows };
  }

  async deleteCategoria(id_categoria, id_usuario, dataAtual, transaction) {
      // Soft Delete manual conforme lógica original. A categoria não é removida, apenas marcada como inativa e com data de inativação, caso o usuário queira reativar depois. E também para manter o histórico de gastos atrelados a ela.
      const [affectedRows] = await this.CategoriasModel.update(
        {
          ativo: false,
          inativadoEm: dataAtual,
        },
        {
          where: { idCategoria: id_categoria, idUsuario: id_usuario },
          transaction,
        }
      );
      return { affectedRows };
  }

  async getCategoriasInativas(idUsuario) {
      const categorias = await this.CategoriasModel.findAll({
        where: {
          idUsuario: idUsuario,
          ativo: false,
        },
        raw: true, // Retorna objeto simples igual o driver mysql fazia
      });
      return categorias;
  }

  async reativarCategoria(id_categoria, id_usuario, transaction) {
      const [affectedRows] = await this.CategoriasModel.update(
        { ativo: true },
        {
          where: {
            idCategoria: id_categoria,
            idUsuario: id_usuario,
          },
          transaction,
        }
      );
      return { affectedRows };
  }

  async buscarPorId(id_categoria, id_usuario) {
      const categoria = await this.CategoriasModel.findOne({
        where: {
          idCategoria: id_categoria,
          idUsuario: id_usuario,
        },
      });
      return categoria ? categoria.toJSON() : null;
  }
}