import RequisicaoIncorreta from "../../../errors/RequisicaoIncorreta.js";

export class CalculadoraFinanceira {
  /**
   * Gera a projeção de parcelas baseada no sistema PRICE (Parcelas fixas).
   * Lógica pura: Recebe valores, retorna Array de objetos.
   */
  static calcularProjecaoPrice({
    valorPrincipal,
    taxaJurosMensal, // em % (ex: 1.5)
    numeroParcelas,
    dataInicio, // Date ou string YYYY-MM-DD
    diaVencimento,
    parcelaInicial = 1
  }) {
    try {
      // 1. Validação de Entradas (Defensive Programming)
      const principal = Number(valorPrincipal);
      const taxa = Number(taxaJurosMensal);
      const parcelas = Number(numeroParcelas);
      const dia = Number(diaVencimento);

      if (isNaN(principal) || principal <= 0) throw new RequisicaoIncorreta("O valor principal deve ser maior que zero.");
      if (isNaN(parcelas) || parcelas <= 0) throw new RequisicaoIncorreta("O número de parcelas deve ser maior que zero.");
      if (isNaN(taxa) || taxa < 0) throw new RequisicaoIncorreta("A taxa de juros não pode ser negativa.");
      if (isNaN(dia) || dia < 1 || dia > 31) throw new RequisicaoIncorreta("Dia de vencimento inválido (1-31).");
      if (!dataInicio) throw new RequisicaoIncorreta("Data de início é obrigatória.");

      // 2. Cálculo da Parcela Fixa (PMT)
      const i = taxa / 100;
      let valorParcelaFixa;

      if (i === 0) {
        // Se juros for 0%, é divisão simples
        valorParcelaFixa = principal / parcelas;
      } else {
        // Fórmula Price: PMT = PV * [ i * (1+i)^n ] / [ (1+i)^n - 1 ]
        const fator = Math.pow(1 + i, parcelas);
        // Proteção contra divisão por zero matemática (embora i > 0 evite isso)
        if (fator === 1) throw new Error("Erro matemático: Taxa de juros resultou em fator neutro.");
        
        valorParcelaFixa = principal * ( (i * fator) / (fator - 1) );
      }

      // 3. Loop de Geração
      const projecao = [];
      let saldoDevedor = principal;
      const dataBase = new Date(dataInicio);

      for (let n = 0; n < parcelas; n++) {
        const jurosMes = saldoDevedor * i;
        const amortizacaoMes = valorParcelaFixa - jurosMes;
        
        saldoDevedor -= amortizacaoMes;
        
        // Ajuste de precisão (evita -0.00 ou 0.00000001)
        if (saldoDevedor < 0.01) saldoDevedor = 0;

        // 4. Lógica de Data Robusta
        // Assumimos: Data Inicio = Contratação. 1ª parcela vence no mês seguinte?
        // Se parcelaInicial for 1, somamos n+1 meses. Se for recálculo, ajustamos conforme a lógica.
        // Padrão: Vencimento começa no mês seguinte à dataInicio baseada na iteração.
        
        let monthsToAdd = n;
        if (parcelaInicial === 1) monthsToAdd += 1; 

        // Cria nova instância de data para não mutar a original
        const dataRef = new Date(dataBase);
        
        // Define o dia como 1 para evitar problemas ao pular de Jan 31 para Fev
        dataRef.setDate(1); 
        dataRef.setMonth(dataRef.getMonth() + monthsToAdd);
        
        const ano = dataRef.getFullYear();
        const mes = dataRef.getMonth(); // 0-11
        
        // Agora setamos o dia de vencimento desejado
        const dataVencimento = new Date(ano, mes, dia);

        // Correção de Overflow de Mês (Ex: 31 de Fev vira Março)
        // Se o mês mudou após setar o dia, significa que o dia não existe naquele mês.
        // Voltamos para o último dia do mês correto (Ex: 28/29 Fev ou 30 Abr)
        if (dataVencimento.getMonth() !== mes) {
            dataVencimento.setDate(0); 
        }

        projecao.push({
          numeroParcela: parcelaInicial + n,
          ano: dataVencimento.getFullYear(),
          mes: dataVencimento.getMonth() + 1, // Ajuste para 1-12
          dataVencimento: dataVencimento,
          // Convertendo para Number com 2 casas decimais para garantir consistência financeira
          valorTotal: Number(valorParcelaFixa.toFixed(2)),
          valorAmortizacao: Number(amortizacaoMes.toFixed(2)),
          valorJuros: Number(jurosMes.toFixed(2)),
          saldoDevedorRestante: Number(saldoDevedor.toFixed(2))
        });
      }

      return projecao;

    } catch (error) {
      // Em domain, erros de validação devem subir, mas logamos se for algo inesperado
      if (!(error instanceof RequisicaoIncorreta)) {
        console.error("Erro crítico na CalculadoraFinanceira:", error);
      }
      throw error;
    }
  }
}