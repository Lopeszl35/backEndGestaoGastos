import { FinanciamentoModel, FinanciamentoParcelaModel } from "../../database/models/index.js";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";
import { Op } from "sequelize";

export default class FinanciamentosRepository {
  
  async criar(dadosFinanciamento, listaParcelas, transaction) {
    try {
      const financiamento = await FinanciamentoModel.create(dadosFinanciamento, { transaction });

      const parcelasParaSalvar = listaParcelas.map(p => ({
        ...p,
        idFinanciamento: financiamento.idFinanciamento,
        idUsuario: dadosFinanciamento.idUsuario
      }));

      await FinanciamentoParcelaModel.bulkCreate(parcelasParaSalvar, { transaction });

      return financiamento;
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.criar:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async buscarAtivos(idUsuario) {
    try {
      return await FinanciamentoModel.findAll({
        where: { idUsuario, ativo: true },
        include: {
          model: FinanciamentoParcelaModel,
          as: "parcelas",
          where: { status: "aberta" },
          required: false,
          limit: 1,
          order: [['dataVencimento', 'ASC']]
        },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.buscarAtivos:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async buscarPorId(idFinanciamento, idUsuario, transaction = null) {
    try {
      return await FinanciamentoModel.findOne({
        where: { idFinanciamento, idUsuario },
        include: [
          { 
            model: FinanciamentoParcelaModel, 
            as: "parcelas",
            required: false 
          }
        ],
        order: [[{ model: FinanciamentoParcelaModel, as: "parcelas" }, 'numeroParcela', 'ASC']],
        transaction
      });
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.buscarPorId:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async buscarParcelaPorId(idParcela, idUsuario, transaction = null) {
    try {
      return await FinanciamentoParcelaModel.findOne({
        where: { idParcela, idUsuario },
        include: [{ model: FinanciamentoModel, as: "financiamento" }],
        transaction
      });
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.buscarParcelaPorId:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async pagarParcela(idParcela, dadosPagamento, transaction) {
    try {
      return await FinanciamentoParcelaModel.update({
        status: 'paga',
        dataPagamento: dadosPagamento.dataPagamento,
        valor: dadosPagamento.valorPago
      }, {
        where: { idParcela },
        transaction
      });
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.pagarParcela:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async atualizarSaldoDevedor(idFinanciamento, dadosAtualizacao, transaction) {
    try {
      await FinanciamentoModel.update(dadosAtualizacao, {
        where: { idFinanciamento },
        transaction
      });
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.atualizarSaldoDevedor:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async removerParcelasFuturas(idFinanciamento, numeroParcelaApartirDe, transaction) {
    try {
      return await FinanciamentoParcelaModel.destroy({
        where: {
          idFinanciamento,
          numeroParcela: { [Op.gte]: numeroParcelaApartirDe },
          status: 'aberta'
        },
        transaction
      });
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.removerParcelasFuturas:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async inserirParcelas(parcelas, transaction) {
    try {
      return await FinanciamentoParcelaModel.bulkCreate(parcelas, { transaction });
    } catch (error) {
      console.error("Erro em FinanciamentosRepository.inserirParcelas:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }
}