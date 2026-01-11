import { validationResult } from "express-validator";
import ValidaEntradasGastos from "./ValidaEntradasGastos.js";
import NaoEncontrado from "../../errors/naoEncontrado.js";

export default class GastoMesController {
  constructor(GastoMesService, TransactionUtil) {
    this.GastoMesService = GastoMesService;
    this.TransactionUtil = TransactionUtil;
  }
  async configGastoLimiteMes(req, res, next) {
    try {
      const { id_usuario } = req.params;
      const  dadosMes  = req.body.dadosMes;
      console.log("Dados recebidos na controller:", { id_usuario, dadosMes });

      const result = await this.TransactionUtil.executeTransaction(
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
    const { id_usuario, ano, mes } = req.query;
    try {
      const result = await this.GastoMesService.getLimiteGastosMes(id_usuario, ano, mes);
      if (result && result.code === "NAO_ENCONTRADO") {
        throw new NaoEncontrado(result.mensagem, 404);
      } 
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getGastosTotaisPorCategoria(req, res, next) {
    try {
      const { inicio, fim } = req.query;
      const idUsuario = req.query.id_usuario;
      console.log("idUsuario no controler: ", idUsuario);
      
      const result = await this.GastoMesService.getGastosTotaisPorCategoria(
        Number(idUsuario),
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
    const id_usuario = Number(req.query.id_usuario);
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
    const { id_usuario, ano, mes } = req.query;
    try {
      const result = await this.GastoMesService.recalcularGastoAtualMes(id_usuario, ano, mes);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

}
