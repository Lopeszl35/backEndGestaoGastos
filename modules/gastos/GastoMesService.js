import {
  EVENTO_GASTO_INSERIDO,
  EVENTO_FORMA_PAGAMENTO_CREDITO,
} from "./registrarListenersDeGastos.js";
import RequisicaoIncorreta from "../../errors/RequisicaoIncorreta.js";
import { formatarDataParaBanco } from "../../utils/formatarDataParaBanco.js";

export default class GastoMesService {
  constructor(GastoMesRepository, BarramentoEventos) {
    this.GastoMesRepository = GastoMesRepository;
    this.BarramentoEventos = BarramentoEventos;
  }

  async configGastoLimiteMes(id_usuario, dadosMes, connection) {
    try {
      return await this.GastoMesRepository.configGastoLimiteMes(
        id_usuario,
        dadosMes,
        connection
      );
    } catch (error) {
      console.error(
        "Erro no GastoMesService.configGastoLimiteMes:",
        error.message
      );
      throw error;
    }
  }

  async getLimiteGastosMes(id_usuario, ano, mes) {
    try {
      return await this.GastoMesRepository.getLimiteGastosMes(
        id_usuario,
        ano,
        mes
      );
    } catch (error) {
      console.error(
        "Erro ao obter limite de gastos no model: " + error.message
      );
      throw error;
    }
  }

  async getGastosTotaisPorCategoria({ idUsuario, inicio, fim }) {
    try {
      return this.GastoMesRepository.getGastosTotaisPorCategoria({
        idUsuario,
        inicio,
        fim,
      });
    } catch (error) {}
  }

  async addGasto(gastos, id_usuario, connection) {
    try {
      if (gastos.forma_pagamento === "CREDITO" && !gastos.uuidCartao) {
        throw new RequisicaoIncorreta(
          "Para lançamentos no Crédito, é obrigatório selecionar um Cartão."
        );
      }

      gastos.data_gasto = formatarDataParaBanco(gastos.data_gasto);

      const result = await this.GastoMesRepository.addGasto(
        gastos,
        id_usuario,
        connection
      );

      // Eventos de domínio (listeners fazem efeitos colaterais)
      if (this.BarramentoEventos) {
        await this.BarramentoEventos.emitir(EVENTO_GASTO_INSERIDO, {
          id_usuario,
          gasto: gastos,
          id_gasto: result?.id_gasto,
          connection,
        });
      }

      if (gastos.forma_pagamento === "CREDITO") {
        await this.BarramentoEventos.emitir(EVENTO_FORMA_PAGAMENTO_CREDITO, {
          id_usuario,
          gasto: gastos,
        });
      }
      return result;
    } catch (error) {
      console.log("Erro ao adicionar gasto no service:", error.message);
      throw error;
    }
  }

  async recalcularGastoAtualMes(id_usuario, connection) {
    try {
      return await this.GastoMesRepository.recalcularGastoAtualMes(
        id_usuario,
        connection
      );
    } catch (error) {
      console.log("Erro ao recalcular gasto atual no service:", error.message);
      throw error;
    }
  }
}
