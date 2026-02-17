
export default class FinanciamentosController {
  constructor(FinanciamentosService, TransactionUtil) {
    this.FinanciamentosService = FinanciamentosService;
    this.TransactionUtil = TransactionUtil;
  }

  async criar(req, res, next) {
    try {
      const idUsuario = Number(req.query.id_usuario);
      const result = await this.TransactionUtil.executeTransaction(async (t) => {
        return await this.FinanciamentosService.criarFinanciamento(idUsuario, req.body, t);
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletar(req, res, next) {
    try {
      const idFinanciamento = Number(req.params.id_financiamento);
      const idUsuario = Number(req.query.id_usuario);
      const result = await this.TransactionUtil.executeTransaction(async (t) => {
        return await this.FinanciamentosService.deletarFinanciamento(idFinanciamento, idUsuario, t);
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async pagarParcela(req, res, next) {
    try {
      const idUsuario = Number(req.query.id_usuario);
      const idParcela = Number(req.params.id_parcela);
      // id_categoria removido da extração do body

      const result = await this.TransactionUtil.executeTransaction(async (t) => {
        return await this.FinanciamentosService.pagarParcela(idUsuario, idParcela, t);
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async amortizar(req, res, next) {
    try {
      const idUsuario = Number(req.query.id_usuario);
      const idFinanciamento = Number(req.params.id_financiamento);
      const { valorAmortizacao } = req.body;
  
      const result = await this.TransactionUtil.executeTransaction(async (t) => {
        return await this.FinanciamentosService.amortizarSaldo(idUsuario, idFinanciamento, valorAmortizacao, t);
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async simular(req, res, next) {
    try {
      const resultado = await this.FinanciamentosService.simularAmortizacao(req.body);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async listarAtivos(req, res, next) {
    try {
      const idUsuario = Number(req.query.id_usuario);
      const lista = await this.FinanciamentosService.listarAtivos(idUsuario);
      console.log("lista: ", lista);
      res.status(200).json(lista);
    } catch (error) {
      next(error);
    }
  }
}