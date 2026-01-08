export const EVENTO_GASTO_INSERIDO = "GASTO_INSERIDO";
export const EVENTO_FORMA_PAGAMENTO_CREDITO = "CARTAO_CREDITO";

export default function registrarListenersDeGastos({
  barramentoEventos,
  gastoMesRepository,
  alertasService,
  userRepository,
  CartoesService,
}) {
  if (!barramentoEventos) throw new Error("barramentoEventos não informado");
  if (!gastoMesRepository) throw new Error("gastoMesRepository não informado");
  if (!alertasService) throw new Error("alertasService não informado");

  // 1) Atualiza total_gastos_mes.gasto_atual_mes
  barramentoEventos.registrarListener(
    EVENTO_GASTO_INSERIDO,
    async (payload) => {
      const { id_usuario, gasto, connection } = payload;

      await gastoMesRepository.incrementarGastoAtualMes({
        id_usuario,
        data_gasto: gasto.data_gasto,
        valor: gasto.valor,
        connection,
      });
    }
  );

  // 2) Cria alertas por limite de categoria
  barramentoEventos.registrarListener(
    EVENTO_GASTO_INSERIDO,
    async (payload) => {
      const { id_usuario, gasto, id_gasto, connection } = payload;

      await alertasService.verificarECriarAlertasCategoriaAoInserirGasto({
        id_usuario,
        id_categoria: gasto.id_categoria,
        data_gasto: gasto.data_gasto,
        id_gasto_referencia: id_gasto,
        connection,
      });
    }
  );

  // 3) Diminuir saldo atual do usuário após gastos
  barramentoEventos.registrarListener(
    EVENTO_GASTO_INSERIDO,
    async (payload) => {
      const { id_usuario, gasto, connection } = payload;

      await userRepository.diminuirSaldoAtual({
        id_usuario,
        valor: gasto.valor,
        connection,
      });
    }
  );

  // 4) assossiar valor da compra da categoria ao cartão de crédito selecionado
  barramentoEventos.registrarListener(
    EVENTO_FORMA_PAGAMENTO_CREDITO,
    async (payload) => {
      const { id_usuario, gasto, connection } = payload;

      const dadosLancamento = {
        descricao: gasto.descricao,
        categoria: dadosLancamento.categoria,
        valorTotal: gato.valor,
        dataCompra: dadosLancamento.data_gasto,
        parcelado: false
      };

      await CartoesService.criarLancamentoCartao({
        idUsuario: id_usuario,
        uuidCartao: gasto.uuidCartao,
      });
    }
  );
}
