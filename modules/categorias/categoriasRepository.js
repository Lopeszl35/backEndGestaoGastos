import { CategoriasModel } from "../../database/models/index.js";
import { sequelize } from "../../database/sequelize.js";
import { QueryTypes, Op } from "sequelize";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";

export default class CategoriasRepository {
  constructor() {}

  async createCategoria(categoria, id_usuario, transaction) {
    try {
      const novaCategoria = await CategoriasModel.create(
        {
          idUsuario: id_usuario,
          nome: categoria.nome,
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
    } catch (error) {
      console.error("Erro no CategoriasRepository.createCategoria:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }

  async checkCategoriaExists(nomeCategoria, id_usuario, transaction) {
    try {
      // CORREÇÃO: Usar Op.and importado do pacote, e não sequelize.Op.and
      const count = await CategoriasModel.count({
        where: {
          idUsuario: id_usuario,
          ativo: true, // Importante: Verifica apenas categorias ATIVAS
          [Op.and]: sequelize.where(
            sequelize.fn("LOWER", sequelize.fn("TRIM", sequelize.col("nome"))),
            sequelize.fn("LOWER", sequelize.fn("TRIM", nomeCategoria))
          ),
        },
        transaction,
      });

      return count > 0;
    } catch (error) {
      console.error("Erro no CategoriasRepository.checkCategoriaExists:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }

  async getCategoriasAtivas(id_usuario) {
    // Mantendo SQL Raw via Sequelize para garantir a lógica de agregação complexa (SUM/CASE)
    // sem depender do Model de Gastos estar pronto/relacionado ainda.
    const sql = `
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
      WHERE cg.id_usuario = :id_usuario
        AND cg.ativo = 1
      GROUP BY cg.id_categoria, cg.nome, cg.limite, cg.ativo
      ORDER BY cg.nome ASC;
    `;

    try {
      const result = await sequelize.query(sql, {
        replacements: { id_usuario },
        type: QueryTypes.SELECT,
      });
      return result;
    } catch (error) {
      console.error("Erro no CategoriasRepository.getCategoriasAtivas:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }

  async updateCategoria(id_categoria, categoria, transaction) {
    console.log("dados para updateCategoria no Repository:", id_categoria, categoria);
    try {
      const [affectedRows] = await CategoriasModel.update(
        {
          nome: categoria.nome,
          limite: categoria.limite,
        },
        {
          where: { idCategoria: id_categoria },
          transaction,
        }
      );
      return { affectedRows };
    } catch (error) {
      console.error("Erro no CategoriasRepository.updateCategoria:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }

  async deleteCategoria(id_categoria, dataAtual, transaction) {
    try {
      // Soft Delete manual conforme lógica original
      const [affectedRows] = await CategoriasModel.update(
        {
          ativo: false,
          inativadoEm: dataAtual,
        },
        {
          where: { idCategoria: id_categoria },
          transaction,
        }
      );
      return { affectedRows };
    } catch (error) {
      console.error("Erro no CategoriasRepository.deleteCategoria:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }

  async getCategoriasInativas(id_usuario) {
    console.log("idUsuario: ", id_usuario);
    try {
      const categorias = await CategoriasModel.findAll({
        where: {
          id_usuario: id_usuario,
          ativo: false,
        },
        raw: true, // Retorna objeto simples igual o driver mysql fazia
      });
      return categorias;
    } catch (error) {
      console.error("Erro no CategoriasRepository.getCategoriasInativas:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }

  async reativarCategoria(id_categoria, id_usuario, transaction) {
    console.log("idUsuario e idCategoria: ", id_categoria, id_usuario);
    try {
      const [affectedRows] = await CategoriasModel.update(
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
    } catch (error) {
      console.error("Erro no CategoriasRepository.reativarCategoria:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }

  async buscarPorId(id_categoria, id_usuario) {
    try {
      const categoria = await CategoriasModel.findOne({
        where: {
          idCategoria: id_categoria,
          idUsuario: id_usuario,
        },
      });
      return categoria ? categoria.toJSON() : null;
    } catch (error) {
      console.error("Erro no CategoriasRepository.buscarPorId:", error.message);
      ErroSqlHandler.tratarErroSql(error);
    }
  }
}