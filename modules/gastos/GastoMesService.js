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
      // 1. Validação prévia
      if (gastos.forma_pagamento === "CREDITO" && !gastos.uuidCartao) {
        throw new RequisicaoIncorreta(
          "Para lançamentos no Crédito, é obrigatório selecionar um Cartão."
        );
      }

      // 2. Prepara e Salva o Gasto no Banco de Dados (Tabela 'gastos')
      // Isso é necessário independente da forma de pagamento para gerar o ID e histórico
      gastos.data_gasto = formatarDataParaBanco(gastos.data_gasto);
      const result = await this.GastoMesRepository.addGasto(
        gastos,
        id_usuario,
        connection
      );

      // 3. Lógica de Eventos (Efeitos Colaterais)
      if (this.BarramentoEventos) {
        if (gastos.forma_pagamento === "CREDITO") {
          // CENÁRIO CRÉDITO:
          // Apenas lança na fatura do cartão.
          // NÃO emite 'EVENTO_GASTO_INSERIDO', pois esse evento desconta saldo e soma no total do mês.
          await this.BarramentoEventos.emitir(EVENTO_FORMA_PAGAMENTO_CREDITO, {
            id_usuario,
            gasto: gastos, 
            connection,
          });

        } else {
          // CENÁRIO DÉBITO / DINHEIRO / PIX:
          // Emite o evento padrão que:
          // 1. Desconta do Saldo Atual
          // 2. Incrementa Gasto Total do Mês
          // 3. Verifica Alertas
          await this.BarramentoEventos.emitir(EVENTO_GASTO_INSERIDO, {
            id_usuario,
            gasto: gastos,
            id_gasto: result?.id_gasto,
            connection,
          });
        }
      }

      // 4. Retorna o resultado da inserção
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
