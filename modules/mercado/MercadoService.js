import axios from 'axios';
import NodeCache from 'node-cache';

// Cache de 5 minutos para cotações e 15 para notícias
const mercadoCache = new NodeCache({ stdTTL: 300 }); 

export default class MercadoService {
  constructor() {
    this.brapiUrl = 'https://brapi.dev/api';
    this.brapiKey = process.env.BRAPI_TOKEN; // Coloque no .env
  }

  // 1. Buscar Cotações (Ações, FIIs, Cripto)
  // Recebe um array de tickers: ['PETR4', 'VALE3', 'BTC']
  async buscarCotacoes(tickers) {
    if (!tickers || tickers.length === 0) return {};

    const cacheKey = `cotacao_${tickers.sort().join('_')}`;
    const cached = mercadoCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Exemplo chamando Brapi (suporta múltiplos tickers por vírgula)
      const tickersString = tickers.join(',');
      const response = await axios.get(`${this.brapiUrl}/quote/${tickersString}`, {
        params: { token: this.brapiKey }
      });

      // Transforma em um mapa para acesso rápido: { 'PETR4': 35.50, 'BTC': 350000 }
      const mapaPrecos = {};
      if (response.data && response.data.results) {
        response.data.results.forEach(item => {
          mapaPrecos[item.symbol] = item.regularMarketPrice;
        });
      }

      mercadoCache.set(cacheKey, mapaPrecos);
      return mapaPrecos;
    } catch (error) {
      console.error("Erro ao buscar cotações:", error.message);
      return {}; // Retorna vazio para não quebrar o front
    }
  }

  // 2. Buscar Notícias (Agregador)
  async buscarNoticiasGlobais() {
    const cacheKey = 'noticias_globais';
    const cached = mercadoCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Aqui você pode chamar Alpha Vantage ou NewsAPI
      // Exemplo fictício simplificado
      const response = await axios.get('https://newsapi.org/v2/everything?q=mercado+financeiro&language=pt&apiKey=SEU_KEY');
      
      const noticias = response.data.articles.map(n => ({
        titulo: n.title,
        fonte: n.source.name,
        url: n.url,
        imagem: n.urlToImage,
        data: n.publishedAt
      }));

      mercadoCache.set(cacheKey, noticias, 900); // 15 min cache
      return noticias;
    } catch (error) {
      console.error("Erro notícias:", error.message);
      return [];
    }
  }
}