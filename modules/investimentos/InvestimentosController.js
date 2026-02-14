export default class InvestimentosController {
  constructor(InvestimentosService, TransactionUtil) {
    this.service = InvestimentosService;
    this.tx = TransactionUtil;
  }

  async criar(req, res, next) {
    try {
      const idUsuario = req.query.id_usuario; // ou req.user.id via token
      const dados = req.body;

      const resultado = await this.tx.executeTransaction(async (t) => {
        return await this.service.criarInvestimento(idUsuario, dados, t);
      });

      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const idUsuario = req.query.id_usuario;
      const dashboard = await this.service.obterDashboard(idUsuario);
      res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  }

  async deletar(req, res, next) {
    try {
      const { id } = req.params;
      const idUsuario = req.query.id_usuario;

      await this.tx.executeTransaction(async (t) => {
        await this.service.removerInvestimento(id, idUsuario, t);
      });

      res.status(200).json({ message: "Investimento removido com sucesso." });
    } catch (error) {
      next(error);
    }
  }
}