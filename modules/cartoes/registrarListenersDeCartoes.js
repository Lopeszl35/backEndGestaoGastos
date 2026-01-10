// Backend/modules/cartoes/registrarListenersDeCartoes.js

export const EVENTO_FATURA_PAGA = "FATURA_PAGA";

export default function registrarListenersDeCartoes({
  barramentoEventos,
  userService, // ou userService, se preferir passar pelo service
}) {
  if (!barramentoEventos) throw new Error("barramentoEventos não informado");
  if (!userService) throw new Error("userService não informado");

  // Listener: Quando a fatura é paga -> Debitar Saldo
  barramentoEventos.registrarListener(
    EVENTO_FATURA_PAGA,
    async (payload) => {
      const { id_usuario, valor, connection } = payload;

      console.log(`[Listener] Processando pagamento de fatura: R$${valor} para usuário ${id_usuario}`);

      // Reutiliza a função que já existe no repositório de usuário
      // IMPORTANTE: Passamos a 'connection' (transação) para garantir atomicidade
      await userService.diminuirSaldoAtualAposPagarFaturaCartao({
        id_usuario,
        valor,
        connection, 
      });
    }
  );
}