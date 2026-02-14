export default class MercadoController {
  constructor(MercadoService) {
    this.MercadoService = MercadoService;
  }

  async getCotacao(req, res, next) {
    try {
      // Ex: ?tickers=PETR4,VALE3
      const { tickers } = req.query;
      const listaTickers = tickers ? tickers.split(',') : [];
      
      const dados = await this.MercadoService.buscarCotacoes(listaTickers);
      res.status(200).json(dados);
    } catch (error) {
      next(error);
    }
  }

  async getNoticias(req, res, next) {
    try {
      const noticias = await this.MercadoService.buscarNoticiasGlobais();
      res.status(200).json(noticias);
    } catch (error) {
      next(error);
    }
  }
}