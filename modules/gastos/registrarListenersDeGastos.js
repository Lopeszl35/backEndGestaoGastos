export const EVENTO_GASTO_INSERIDO = "GASTO_INSERIDO";
export const EVENTO_FORMA_PAGAMENTO_CREDITO = "CREDITO";

// Função auxiliar para esperar (Sleep)
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function registrarListenersDeGastos({
  barramentoEventos,
  gastoMesRepository,
  alertasService,
  userRepository,
  cartoesService,
  categoriasRepository,
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

  // 4) Associar valor da compra ao cartão de crédito com Retry e Fallback
  barramentoEventos.registrarListener(
    EVENTO_FORMA_PAGAMENTO_CREDITO,
    async (payload) => {
      const { id_usuario, gasto } = payload; 
      console.log("Entrou em gasto credito");

      // Validação de segurança (Fail Fast)
      if (!gasto.uuidCartao) {
        console.error("ERRO CRÍTICO: Gasto crédito sem uuidCartao.", gasto);
        return;
      }

      // -- Buscando categoria no banco
      // O 'gasto' vem apenas com id_categoria (ex: 8). Precisamos do nome (ex: "Lazer").
      let nomeCategoria = "Outros"
      try {
        if (gasto.id_categoria && categoriasRepository) {
          console.log("entrou no if, gastos recebido: ", gasto.id_categoria);
          const catDb = await categoriasRepository.buscarPorId(gasto.id_categoria, id_usuario);
          console.log("catDb: ", catDb);
          if (catDb && catDb.nome) {
            nomeCategoria = catDb.nome
          }
        }
      } catch (error) {
        console.warn(`Erro ao buscar categoria do gasto: ${error.message}`);
      }

      const dadosLancamento = {
        descricao: gasto.descricao,
        categoria: nomeCategoria,
        valorTotal: gasto.valor,
        dataCompra: gasto.data_gasto,
        parcelado: false,
        numeroParcelas: 1,
      };
      console.log("dadosLancamento: ", dadosLancamento);

      // --- LÓGICA DE RETRY ---
      const TENTATIVAS_MAXIMAS = 3;
      let tentativa = 1;
      let sucesso = false;

      while (tentativa <= TENTATIVAS_MAXIMAS && !sucesso) {
        try {
          await cartoesService.criarLancamentoCartao({
            idUsuario: id_usuario,
            uuidCartao: gasto.uuidCartao,
            dadosLancamento,
          });

          sucesso = true;
          console.log(
            `Lançamento cartão processado com sucesso na tentativa ${tentativa}.`
          );
        } catch (error) {
          console.warn(`Tentativa ${tentativa} falhou: ${error.message}`);

          if (tentativa < TENTATIVAS_MAXIMAS) {
            // Backoff Exponencial: Espera 1s, depois 2s, depois sai.
            const tempoEspera = 1000 * Math.pow(2, tentativa - 1);
            await esperar(tempoEspera);
            tentativa++;
          } else {
            // --- FALHA TOTAL (FALLBACK) ---
            console.error("Todas as tentativas de processar cartão falharam.");

            // Notificar o usuário que algo deu errado
            // Assumindo que seu AlertasService tem um método genérico de criar alerta
            try {
              await alertasService.criarAlertaSistema({
                id_usuario,
                tipo_alerta: "ERRO_PROCESSAMENTO",
                mensagem: `Não foi possível vincular a despesa '${gasto.descricao}' ao seu cartão automaticamente. Verifique seus lançamentos.`,
                severidade: "ALTA",
              });
            } catch (erroAlerta) {
              console.error("Falha até ao criar o alerta de erro:", erroAlerta);
            }
          }
        }
      }
    }
  );
}
