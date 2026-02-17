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

  // 3) Diminuir saldo atual do usuário 
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
          const catDb = await categoriasRepository.buscarPorId(gasto.id_categoria, id_usuario);
          console.log("catDb: ", catDb);
          if (catDb && catDb.nome) {
            nomeCategoria = catDb.nome;
          }
        }
      } catch (error) {
        console.warn(`Erro ao buscar categoria do gasto: ${error.message}`);
      }

      // --- CORREÇÃO DE DATA AQUI ---
      // Converte qualquer formato de entrada para um objeto Date e depois para string YYYY-MM-DD
      let dataFormatada;
      try {
          // Garante que a data seja interpretada corretamente
          const dataObj = new Date(gasto.data_gasto);
          if (isNaN(dataObj.getTime())) {
              throw new Error("Data inválida");
          }
          // Pega YYYY-MM-DD (ISO 8601 part)
          dataFormatada = dataObj.toISOString().split('T')[0];
      } catch (e) {
          // Fallback: se der erro na conversão, tenta usar o que veio (mas o Entity vai validar)
          dataFormatada = String(gasto.data_gasto);
      }

      const dadosLancamento = {
        descricao: gasto.descricao,
        categoria: nomeCategoria,
        valorTotal: Number(gasto.valor),
        dataCompra: dataFormatada, // Agora envia "YYYY-MM-DD" com hífens
        parcelado: false,
        numeroParcelas: 1,
      };

      let uuidParaCartao = gasto.uuidCartao;
      
      const TENTATIVAS_MAXIMAS = 3;
      let tentativa = 1;
      let sucesso = false;

      while (tentativa <= TENTATIVAS_MAXIMAS && !sucesso) {
        try {
          await cartoesService.criarLancamentoCartao({
            idUsuario: id_usuario,
            uuidCartao: uuidParaCartao,
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
            if (alertasService?.criarAlertaSistema) {
                await alertasService.criarAlertaSistema({
                    id_usuario,
                    tipo_alerta: "ERRO_PROCESSAMENTO",
                    mensagem: `Falha ao lançar despesa '${gasto.descricao}' no cartão: ${error.message}`,
                    severidade: "ALTA"
                });
            }
          }
        }
      }
    }
  );
}