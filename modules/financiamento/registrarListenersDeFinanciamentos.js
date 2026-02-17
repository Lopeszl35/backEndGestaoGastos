import { Transaction } from "sequelize";
import { EVENTO_PAGAMENTO_FINANCIAMENTO } from "./FinanciamentosService.js";

export default function registrarListenersDeFinanciamentos({
  barramentoEventos,
  gastoMesService,
  userRepository,
}) {
  if (!barramentoEventos) throw new Error("barramentoEventos é obrigatório");
  if (!gastoMesService) throw new Error("gastoMesService é obrigatório");
  if (!userRepository) throw new Error("userRepository é obrigatório");

  barramentoEventos.registrarListener(
    EVENTO_PAGAMENTO_FINANCIAMENTO, transaction,
    async (payload) => {
        const { 
          id_usuario, 
          valor, 
          // id_categoria virá como NULL
          id_financiamento, 
          titulo_financiamento, 
          numero_parcela, 
          total_parcelas,
          data_gasto, 
          connection 
        } = payload;

        // 1. Debitar Saldo
        if (userRepository && userRepository.diminuirSaldoAtual) {
          await userRepository.diminuirSaldoAtual({
            id_usuario,
            valor,
            connection,
          });
        }

        // 2. Criar Gasto no Hub Central
        // O id_categoria será salvo como NULL no banco
        if (gastoMesService && gastoMesService.addGasto) {
          const descricao = `Parc. ${numero_parcela}/${total_parcelas} - ${titulo_financiamento}`;
          
          await gastoMesService.addGasto({
            valor: valor,
            data_gasto: data_gasto,
            descricao: descricao,
            id_categoria: null, // GARANTIDO NULO
            forma_pagamento: 'DEBITO',
            origem_lancamento: 'financiamento',
            id_financiamento: id_financiamento
          }, id_usuario, connection);
        }
    }
  );
}