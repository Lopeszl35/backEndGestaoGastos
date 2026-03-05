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
          await userRepository.diminuirSaldoAtual({
            id_usuario,
            valor: gasto.valor,
            connection,
          });
    }
  );

 // 4) Associar valor da compra ao cartão de crédito
  barramentoEventos.registrarListener(
    EVENTO_FORMA_PAGAMENTO_CREDITO,
    async (payload) => {
      const { id_usuario, gasto, connection } = payload; 
      console.log("Entrou em gasto credito listener");

      if (!gasto.id_cartao && !gasto.uuidCartao) {
        throw new Error("Gasto no crédito exige um cartão identificado.");
      }

      // Busca nome da categoria
      let nomeCategoria = "Outros";
      if (gasto.id_categoria && categoriasRepository) {
        // Usa o repositório de forma limpa, se der erro, sobe e faz rollback
        const catDb = await categoriasRepository.buscarPorId({
          id_categoria: gasto.id_categoria,
          id_usuario: id_usuario, 
          connection // Repassa transação pra leitura limpa
        });
        if (catDb && catDb.nome) {
          nomeCategoria = catDb.nome;
        }
      }

      // Converte data
      let dataFormatada;
      const dataObj = new Date(gasto.data_gasto);
      if (isNaN(dataObj.getTime())) {
          throw new Error("Data de lançamento no cartão inválida");
      }
      dataFormatada = dataObj.toISOString().split('T')[0];
      
      const dadosLancamento = {
        descricao: gasto.descricao,
        categoria: nomeCategoria,
        valorTotal: Number(gasto.valor),
        dataCompra: dataFormatada,
        parcelado: false,
        numeroParcelas: 1,
      };

      // 🛡️ UNIT OF WORK: Se falhar, falha rápido (Fail-Fast) 
      // e o GastoMesService reverte a inserção na tabela de gastos!
      await cartoesService.criarLancamentoCartao({
        idUsuario: id_usuario,
        uuidCartao: gasto.uuidCartao,
        dadosLancamento,
        connection // 💉 INJETANDO A TRANSAÇÃO NO MOTOR DE CARTÕES
      });
      
      console.log(`Lançamento no cartão processado com sucesso.`);
    }
  );
}