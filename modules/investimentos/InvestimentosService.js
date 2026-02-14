export default class InvestimentosService {
  constructor(InvestimentosRepository, MercadoService) {
    this.repo = InvestimentosRepository;
    this.mercadoService = MercadoService; // Injeção de dependência
  }

  async obterDashboard(idUsuario) {
    // 1. Busca carteira no banco (MySQL)
    // Retorna: [{ ticker: 'PETR4', qtd: 100, preco_medio: 30.00 }, ...]
    const meusAtivos = await this.repo.listarPorUsuario(idUsuario);

    // 2. Extrai os tickers para buscar preço atual
    const tickersParaBuscar = meusAtivos
      .filter(a => a.tipo === 'ACAO' || a.tipo === 'FII' || a.tipo === 'CRIPTO')
      .map(a => a.ticker);

    // 3. Busca preços em tempo real (Cacheado)
    const cotacoes = await this.mercadoService.buscarCotacoes(tickersParaBuscar);

    // 4. Calcula Rentabilidade
    const carteiraAtualizada = meusAtivos.map(ativo => {
      const precoAtual = cotacoes[ativo.ticker] || ativo.preco_medio; // Fallback se api falhar
      const valorTotalAtual = Number(ativo.quantidade) * precoAtual;
      const valorInvestido = Number(ativo.valor_total_investido);
      
      const lucroPrejuizo = valorTotalAtual - valorInvestido;
      const rentabilidadePerc = (lucroPrejuizo / valorInvestido) * 100;

      return {
        ...ativo.toJSON(), // Dados do banco
        preco_atual: precoAtual,
        valor_atual_total: valorTotalAtual,
        rentabilidade_valor: lucroPrejuizo,
        rentabilidade_percentual: rentabilidadePerc.toFixed(2)
      };
    });

    // 5. Totalizador
    const totalInvestido = carteiraAtualizada.reduce((acc, a) => acc + Number(a.valor_total_investido), 0);
    const saldoAtual = carteiraAtualizada.reduce((acc, a) => acc + a.valor_atual_total, 0);

    return {
      resumo: {
        totalInvestido,
        saldoAtual,
        variacaoTotal: saldoAtual - totalInvestido
      },
      ativos: carteiraAtualizada
    };
  }
}