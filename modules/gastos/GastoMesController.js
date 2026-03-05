import NaoEncontrado from "../../errors/naoEncontrado.js";
import { matchedData } from "express-validator";

export default class GastoMesController {
  constructor(GastoMesService, TransactionUtil) {
    this.GastoMesService = GastoMesService;
    this.TransactionUtil = TransactionUtil;
  }
  async configGastoLimiteMes(req, res, next) {
    try {
      const id_usuario = req.userId;
      const  dadosMes  = matchedData(req, { locations: ['body'] }).dadosMes;

      await this.TransactionUtil.executeTransaction(
        async (connection) => {
          return this.GastoMesService.configGastoLimiteMes(
            id_usuario,
            dadosMes,
            connection
          );
        }
      );

      res.status(200).json({
        message: "Configuração de limite de gasto mensal atualizada com sucesso.",
      });
    } catch (error) {
      next(error);
    }
  }
  async getGastoLimiteMes(req, res, next) { 
    try {
      const { ano, mes } = matchedData(req, { locations: ["query"] });
      const id_usuario = req.userId;

      const limite = await this.GastoMesService.getLimiteGastosMes(id_usuario, ano, mes);
      if (!limite) {
              throw new NaoEncontrado("Nenhum limite de gastos configurado para este mês.");
          }
      res.status(200).json({
              message: "Limite recuperado com sucesso.",
              status: 200,
              data: limite
          });
    } catch (error) {
      next(error);
    }
  }

  async getGastosTotaisPorCategoria(req, res, next) {
    try {
      const { inicio, fim } = req.query;
      const id_usuario = req.userId;
      
      const result = await this.GastoMesService.getGastosTotaisPorCategoria(
        Number(id_usuario),
        inicio || null,
        fim || null
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async addGasto(req, res, next) {
    const gasto = req.body.gastos; 
    const id_usuario = req.userId;
    try {
      const result = await this.TransactionUtil.executeTransaction(
        async (connection) => {
          return await this.GastoMesService.addGasto(
            gasto,
            id_usuario,
            connection
          );
        }
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async recalcularGastoAtualMes(req, res, next) {
    const { ano, mes } = req.query;
    try {
      const id_usuario = req.userId;
      const result = await this.TransactionUtil.executeTransaction(
        async (connection) => {
          return await this.GastoMesService.recalcularGastoAtualMes(
            id_usuario,
            ano,
            mes,
            connection
          );
        }
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

}
