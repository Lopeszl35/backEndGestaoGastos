import { CalculadoraFinanceira } from "./domain/CalculadoraFinanceira.js";
import RequisicaoIncorreta from "../../errors/RequisicaoIncorreta.js";
import NaoEncontrado from "../../errors/naoEncontrado.js";

export const EVENTO_PAGAMENTO_FINANCIAMENTO = "PAGAMENTO_FINANCIAMENTO";

export default class FinanciamentosService {
  constructor(FinanciamentosRepository, BarramentoEventos) {
    this.repo = FinanciamentosRepository;
    this.bus = BarramentoEventos;
  }

  async criarFinanciamento(idUsuario, dados, transaction) {
    try {
      // Regra de Negócio: Calcular parcelas
      const parcelasCalculadas = CalculadoraFinanceira.calcularProjecaoPrice({
        valorPrincipal: Number(dados.valorTotal),
        taxaJurosMensal: Number(dados.taxaJurosMensal),
        numeroParcelas: Number(dados.numeroParcelas),
        dataInicio: new Date(dados.dataInicio),
        diaVencimento: Number(dados.diaVencimento)
      });

      const financiamentoHeader = {
        idUsuario,
        titulo: dados.titulo,
        instituicao: dados.instituicao,
        valorTotal: dados.valorTotal,
        valorRestante: dados.valorTotal,
        numeroParcelas: dados.numeroParcelas,
        taxaJurosMensal: dados.taxaJurosMensal,
        sistemaAmortizacao: "PRICE",
        dataInicio: dados.dataInicio,
        diaVencimento: dados.diaVencimento,
        ativo: true
      };

      const parcelasDb = parcelasCalculadas.map(p => ({
        numeroParcela: p.numeroParcela,
        ano: p.ano,
        mes: p.mes,
        dataVencimento: p.dataVencimento,
        valor: p.valorTotal,
        valorAmortizacao: p.valorAmortizacao,
        valorJuros: p.valorJuros,
        status: 'aberta'
      }));

      return await this.repo.criar(financiamentoHeader, parcelasDb, transaction);
    } catch (error) {
      console.error("Erro Service criarFinanciamento:", error.message);
      throw error;
    }
  }

  // NOTA: id_categoria removido dos parâmetros
  async pagarParcela(idUsuario, idParcela, transaction) {
    try {
      const parcela = await this.repo.buscarParcelaPorId(idParcela, idUsuario, transaction);
      
      if (!parcela) throw new NaoEncontrado("Parcela não encontrada.");
      if (parcela.status === 'paga') throw new RequisicaoIncorreta("Parcela já paga.");

      // 1. Baixa no banco
      const dataPagamento = new Date();
      await this.repo.pagarParcela(idParcela, {
        dataPagamento,
        valorPago: parcela.valor 
      }, transaction);

      // 2. Atualiza Contrato
      const contrato = parcela.financiamento;
      const novoSaldo = Number(contrato.valorRestante) - Number(parcela.valorAmortizacao);
      const novasParcelasPagas = contrato.parcelasPagas + 1;
      const ativo = novasParcelasPagas < contrato.numeroParcelas;

      await this.repo.atualizarSaldoDevedor(contrato.idFinanciamento, {
        valorRestante: novoSaldo < 0 ? 0 : novoSaldo,
        parcelasPagas: novasParcelasPagas,
        ativo: ativo
      }, transaction);

      // 3. Emite Evento -> Envia NULL no id_categoria
      if (this.bus) {
        await this.bus.emitir(EVENTO_PAGAMENTO_FINANCIAMENTO, {
          id_usuario: idUsuario,
          valor: Number(parcela.valor),
          id_categoria: null, // <--- NULO: Financiamento não tem categoria de gasto variável
          id_financiamento: contrato.idFinanciamento,
          titulo_financiamento: contrato.titulo,
          numero_parcela: parcela.numeroParcela,
          total_parcelas: contrato.numeroParcelas,
          data_gasto: dataPagamento,
          connection: transaction
        });
      }

      return { 
        mensagem: "Parcela paga com sucesso.", 
        financiamento_concluido: !ativo 
      };
    } catch (error) {
      console.error("Erro Service pagarParcela:", error.message);
      throw error;
    }
  }

  async simularAmortizacao(dados) {
    try {
      return CalculadoraFinanceira.calcularProjecaoPrice({
        valorPrincipal: Number(dados.valorTotal),
        taxaJurosMensal: Number(dados.taxaJurosMensal),
        numeroParcelas: Number(dados.numeroParcelas),
        dataInicio: new Date(),
        diaVencimento: 10
      });
    } catch (error) {
      console.error("Erro Service simularAmortizacao:", error.message);
      throw error;
    }
  }

  async amortizarSaldo(idUsuario, idFinanciamento, valorAmortizacao, transaction) {
    try {
      const contrato = await this.repo.buscarPorId(idFinanciamento, idUsuario, transaction);
      if (!contrato || !contrato.ativo) throw new RequisicaoIncorreta("Financiamento não encontrado ou inativo.");

      const saldoAtual = Number(contrato.valorRestante);
      let novoSaldo = saldoAtual - valorAmortizacao;
      if (novoSaldo < 0) novoSaldo = 0;

      // Remove parcelas futuras
      const parcelasPagas = contrato.parcelasPagas;
      const proximaParcelaNum = parcelasPagas + 1;
      await this.repo.removerParcelasFuturas(idFinanciamento, proximaParcelaNum, transaction);

      if (novoSaldo > 0) {
        // Recalcula novas parcelas
        const parcelasRestantes = contrato.numeroParcelas - parcelasPagas;
        const novasParcelas = CalculadoraFinanceira.calcularProjecaoPrice({
          valorPrincipal: novoSaldo,
          taxaJurosMensal: Number(contrato.taxaJurosMensal),
          numeroParcelas: parcelasRestantes,
          dataInicio: new Date(),
          diaVencimento: contrato.diaVencimento,
          parcelaInicial: proximaParcelaNum
        });
        
        const parcelasDb = novasParcelas.map(p => ({
          idFinanciamento: contrato.idFinanciamento,
          idUsuario: idUsuario,
          numeroParcela: p.numeroParcela,
          ano: p.ano,
          mes: p.mes,
          dataVencimento: p.dataVencimento,
          valor: p.valorTotal,
          valorAmortizacao: p.valorAmortizacao,
          valorJuros: p.valorJuros,
          status: 'aberta'
        }));
        await this.repo.inserirParcelas(parcelasDb, transaction);
      }

      await this.repo.atualizarSaldoDevedor(idFinanciamento, { 
        valorRestante: novoSaldo,
        ativo: novoSaldo > 0
      }, transaction);

      // Evento de Amortização (Categoria NULL)
      if (this.bus) {
        await this.bus.emitir(EVENTO_PAGAMENTO_FINANCIAMENTO, {
          id_usuario: idUsuario,
          valor: valorAmortizacao,
          id_categoria: null, 
          id_financiamento: contrato.idFinanciamento,
          titulo_financiamento: contrato.titulo + " (Amortização)",
          numero_parcela: 0,
          total_parcelas: 0,
          data_gasto: new Date(),
          connection: transaction
        });
      }
      return { mensagem: "Amortização realizada com sucesso." };

    } catch (error) {
      console.error("Erro Service amortizarSaldo:", error.message);
      throw error;
    }
  }

  // modules/financiamento/FinanciamentosService.js

  async listarAtivos(idUsuario) {
    try {
      const financiamentos = await this.repo.buscarAtivos(idUsuario);

      // Variáveis acumuladoras
      let dividaTotal = 0;
      let parcelaTotalMensal = 0;
      let somaTaxas = 0;
      let qtdFinanciamentos = financiamentos.length;

      // Mapeia para formatar os dados e fazer os cálculos
      const itens = financiamentos.map(f => {
        const json = f.toJSON();
        
        // Tenta pegar o valor da próxima parcela do include, ou 0 se não houver
        const proximaParcela = (f.parcelas && f.parcelas.length > 0) ? f.parcelas[0] : null;
        const valorParcelaAtual = proximaParcela ? Number(proximaParcela.valor) : 0;

        // Acumula os valores
        dividaTotal += Number(f.valorRestante);
        parcelaTotalMensal += valorParcelaAtual;
        somaTaxas += Number(f.taxaJurosMensal || 0);

        // Adiciona campos extras úteis no objeto de retorno individual
        return {
          ...json,
          valorParcelaAtual: valorParcelaAtual, // Útil para o front mostrar quanto é a parcela deste mês
          proximoVencimento: proximaParcela ? proximaParcela.dataVencimento : null
        };
      });

      // Calcula média (evita divisão por zero)
      const taxaMedia = qtdFinanciamentos > 0 ? (somaTaxas / qtdFinanciamentos) : 0;

      // Retorna objeto estruturado com o Resumo + Lista
      return {
        resumo: {
          dividaTotal: Number(dividaTotal.toFixed(2)),
          parcelaTotal: Number(parcelaTotalMensal.toFixed(2)), // Soma de todas as parcelas que o usuário paga no mês
          taxaMedia: Number(taxaMedia.toFixed(4)) // Média simples das taxas
        },
        financiamentos: itens
      };

    } catch (error) {
      console.error("Erro Service listarAtivos:", error.message);
      throw error;
    }
  }
}