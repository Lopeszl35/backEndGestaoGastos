import { formatarDataParaBanco } from "../../utils/formatarDataParaBanco.js";

export const EVENTO_GASTO_INSERIDO = "GASTO_INSERIDO";
export const EVENTO_FORMA_PAGAMENTO_CREDITO = "CREDITO";
export const EVENTO_GASTO_EDITADO = "GASTO_EDITADO";
export const EVENTO_GASTO_DELETADO = "GASTO_DELETADO";

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
  // Outras validações...

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
      // Certifique-se que alertasService tem esse método
      if (alertasService.verificarECriarAlertasCategoriaAoInserirGasto) {
          await alertasService.verificarECriarAlertasCategoriaAoInserirGasto({
            id_usuario,
            id_categoria: gasto.id_categoria,
            data_gasto: gasto.data_gasto,
            id_gasto_referencia: id_gasto,
            connection,
          });
      }
    }
  );

  // 3) Diminuir saldo atual do usuário (agora chamando o método novo do service/repo refatorado)
  barramentoEventos.registrarListener(
    EVENTO_GASTO_INSERIDO,
    async (payload) => {
      const { id_usuario, gasto, connection } = payload;
      if (userRepository.diminuirSaldoAtual) {
          await userRepository.diminuirSaldoAtual({
            id_usuario,
            valor: gasto.valor,
            connection,
          });
      }
    }
  );

  // 4) Associar valor da compra ao cartão de crédito
  barramentoEventos.registrarListener(
    EVENTO_FORMA_PAGAMENTO_CREDITO,
    async (payload) => {
      const { id_usuario, gasto } = payload; 
      console.log("Entrou em gasto credito listener");

      if (!gasto.id_cartao && !gasto.uuidCartao) {
        console.error("ERRO: Gasto crédito sem cartão identificado.");
        return;
      }

      // Busca nome da categoria
      let nomeCategoria = "Outros";
      try {
        if (gasto.id_categoria && categoriasRepository) {
          const catDb = await categoriasRepository.buscarCategoriaPorId(gasto.id_categoria, id_usuario);
          if (catDb && catDb.nome) {
            nomeCategoria = catDb.nome;
          }
        }
      } catch (error) {
        console.warn(`Erro ao buscar categoria do gasto: ${error.message}`);
      }

      // Formatação de data se necessário (Sequelize já devolve Date ou string YYYY-MM-DD)
      const dataFormatada = String(gasto.data_gasto).substring(0, 10);

      const dadosLancamento = {
        descricao: gasto.descricao,
        categoria: nomeCategoria,
        valorTotal: Number(gasto.valor),
        dataCompra: dataFormatada,
        parcelado: false,
        numeroParcelas: 1,
      };

      // Tenta usar uuidCartao (se veio do front) ou busca uuid pelo id_cartao se já salvou no banco
      let uuidParaCartao = gasto.uuidCartao;
      
      // Retry Logic
      const TENTATIVAS_MAXIMAS = 3;
      let tentativa = 1;
      let sucesso = false;

      while (tentativa <= TENTATIVAS_MAXIMAS && !sucesso) {
        try {
          await cartoesService.criarLancamentoCartao({
            idUsuario: id_usuario,
            uuidCartao: uuidParaCartao, // O Service de Cartões espera UUID
            dadosLancamento,
          });
          sucesso = true;
          console.log(`Lançamento cartão processado na tentativa ${tentativa}.`);
        } catch (error) {
          console.warn(`Tentativa ${tentativa} falhou: ${error.message}`);
          if (tentativa < TENTATIVAS_MAXIMAS) {
            await esperar(1000 * Math.pow(2, tentativa - 1));
            tentativa++;
          } else {
            console.error("Falha final ao processar cartão.");
            // Criar alerta de erro
            if (alertasService.criarAlertaSistema) {
                await alertasService.criarAlertaSistema({
                    id_usuario,
                    tipo_alerta: "ERRO_PROCESSAMENTO",
                    mensagem: `Falha ao lançar despesa '${gasto.descricao}' no cartão.`,
                    severidade: "ALTA"
                });
            }
          }
        }
      }
    }
  );
}