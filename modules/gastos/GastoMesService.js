import {
  EVENTO_GASTO_INSERIDO,
  EVENTO_FORMA_PAGAMENTO_CREDITO,
} from "./registrarListenersDeGastos.js";
import RequisicaoIncorreta from "../../errors/RequisicaoIncorreta.js";
import { GastosEntity } from "./domain/GastosEntity.js"; 

export default class GastoMesService {
  constructor(GastoMesRepository, BarramentoEventos, CartoesService) {
    this.GastoMesRepository = GastoMesRepository;
    this.BarramentoEventos = BarramentoEventos;
    this.CartoesService = CartoesService;
  }

  async configGastoLimiteMes(id_usuario, dadosMes, connection) {
      return await this.GastoMesRepository.configGastoLimiteMes(
        id_usuario,
        dadosMes,
        connection
      );
  }

  async getLimiteGastosMes(id_usuario, ano, mes) {
      return await this.GastoMesRepository.getLimiteGastosMes(
        id_usuario,
        ano,
        mes
      );
  }

  async getGastosTotaisPorCategoria(idUsuario, inicio, fim) {
      return this.GastoMesRepository.getGastosTotaisPorCategoria({
        idUsuario,
        inicio,
        fim,
      });
  }

  async addGasto(gastosDTO, id_usuario, connection) {
      // 🛡️ RICH DOMAIN: A Entidade valida as regras de negócio internamente (ex: valor > 0)
      const gastoEntidade = new GastosEntity({
          ...gastosDTO,
          id_usuario
      });

      // 1. Validação prévia de Cartão de Crédito
      if (gastoEntidade.forma_pagamento === "CREDITO") {
        if (!gastosDTO.uuidCartao) {
          throw new RequisicaoIncorreta("Para lançamentos no crédito, é obrigatório selecionar um cartão.");
        }
        
        const cartao = await this.CartoesService.buscarPorUuid(
          gastosDTO.uuidCartao,
          connection
        );
  
        if (!cartao) {
          throw new RequisicaoIncorreta("Cartão não encontrado, ou inválido.");
        }
        
        // Atualiza a entidade com o ID do cartão relacional
        gastoEntidade.id_cartao = cartao.id_cartao;
      }

      // 2. Prepara os dados para o Banco usando o contrato da Entidade
      const dadosParaPersistencia = gastoEntidade.toPersistence();

      // Salva na tabela 'gastos' usando o formato blindado
      const result = await this.GastoMesRepository.addGasto(
        dadosParaPersistencia,
        id_usuario,
        connection
      );

      // 3. Lógica de Eventos (Efeitos Colaterais)
      if (this.BarramentoEventos) {
        
        // Montamos um Payload seguro unindo a entidade e os IDs do cartão/banco
        const eventoPayload = {
            id_usuario,
            gasto: {
                ...dadosParaPersistencia,
                uuidCartao: gastosDTO.uuidCartao // Mantém para uso do Listener
            },
            id_gasto: result?.id_gasto,
            connection,
        };

        if (gastoEntidade.forma_pagamento === "CREDITO") {
          // CENÁRIO CRÉDITO: Lança na fatura, NÃO abate saldo do mês agora.
          await this.BarramentoEventos.emitir(EVENTO_FORMA_PAGAMENTO_CREDITO, eventoPayload);
        } else {
          // CENÁRIO COMUM (Débito, Pix, Dinheiro): Desconta saldo, soma no mês, verifica alertas.
          await this.BarramentoEventos.emitir(EVENTO_GASTO_INSERIDO, eventoPayload);
        }
      }

      // 4. Retorna o resultado da inserção
      return result;
  }

  async recalcularGastoAtualMes(id_usuario, ano, mes, connection) {
      return await this.GastoMesRepository.recalcularGastoAtualMes(
        id_usuario,
        ano,
        mes,
        connection
      );
  }
}