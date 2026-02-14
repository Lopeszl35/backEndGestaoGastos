import { InvestimentoModel } from "../../database/models/index.js";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";

export default class InvestimentosRepository {
  async criar(dados, transaction) {
    try {
      return await InvestimentoModel.create(dados, { transaction });
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async listarPorUsuario(idUsuario) {
    try {
      return await InvestimentoModel.findAll({
        where: { idUsuario },
        order: [['tipo', 'ASC'], ['nome', 'ASC']]
      });
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async deletar(idInvestimento, idUsuario, transaction) {
    try {
      return await InvestimentoModel.destroy({
        where: { idInvestimento, idUsuario },
        transaction
      });
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }
}