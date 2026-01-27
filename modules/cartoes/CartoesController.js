export class CartoesController {
  constructor(cartoesService) {
    this.cartoesService = cartoesService;
  }

  async obterVisaoGeral(req, res, next) {
    try {
      const idUsuario = Number(req.params.id_usuario);
      const ano = Number(req.query.ano);
      const mes = Number(req.query.mes);
      const uuidCartaoSelecionado = req.query.cartao_uuid ?? null;

      const resultado = await this.cartoesService.obterVisaoGeralCartoes({
        idUsuario,
        ano,
        mes,
        uuidCartaoSelecionado,
      });

      return res.status(200).json(resultado);
    } catch (erro) {
      return next(erro);
    }
  }

  async criarCartao(req, res, next) {
    try {
      const idUsuario = Number(req.params.id_usuario);

      const resultado = await this.cartoesService.criarCartaoCredito({
        idUsuario,
        dadosCartao: {
          nome: req.body.nome,
          bandeira: req.body.bandeira,
          ultimos4: req.body.ultimos4,
          corHex: req.body.corHex,
          limite: req.body.limite,
          diaFechamento: req.body.diaFechamento,
          diaVencimento: req.body.diaVencimento,
        },
      });

      return res.status(201).json(resultado);
    } catch (erro) {
      return next(erro);
    }
  }

  async criarLancamento(req, res, next) {
    try {
        const idUsuario = Number(req.params.id_usuario);
        const uuidCartao = String(req.params.cartao_uuid);

        const resultado = await this.cartoesService.criarLancamentoCartao({
        idUsuario,
        uuidCartao,
        dadosLancamento: {
            descricao: req.body.descricao,
            categoria: req.body.categoria,
            valorTotal: req.body.valorTotal,
            dataCompra: req.body.dataCompra,
            parcelado: req.body.parcelado,
            numeroParcelas: req.body.numeroParcelas,
        },
        });

        return res.status(201).json(resultado);
    } catch (erro) {
        return next(erro);
    }
    }

    async ativarDesativarCartao(req, res, next) {
      try {
          const idUsuario = Number(req.params.id_usuario);
          const uuidCartao = String(req.params.cartao_uuid);
          const ativar = req.query.ativar;
    
          const resultado = await this.cartoesService.ativarDesativarCartao({
              idUsuario,
              uuidCartao,
              ativar,
          });
    
          return res.status(200).json(resultado);
      } catch (erro) {
          return next(erro);
      }
  }

  async editarCartao(req, res, next) {
    try {
      const idUsuario = Number(req.params.id_usuario);
      const uuidCartao = String(req.params.cartao_uuid);
      const dadosCartao = req.body; 

      const resultado = await this.cartoesService.editarCartao(
        idUsuario,
        uuidCartao,
        dadosCartao
      );

      return res.status(200).json(resultado);
    } catch (erro) {
      next(erro);
    }
  }

  async pagarFatura(req, res, next) {
    try {
      const idUsuario = Number(req.params.id_usuario);
      const idCartao = Number(req.params.id_cartao);
      const { valorPagamento, ano, mes } = req.body;

      const resultado = await this.cartoesService.pagarFatura({
        idUsuario,
        idCartao,
        valorPagamento,
        ano,
        mes,
      });

      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async obterTodosCartoes(req, res, next) {
    try {
      const idUsuario = Number(req.params.id_usuario);
      const resultado = await this.cartoesService.obterTodosCartoes(idUsuario);
      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async deletarCartao(req, res, next) {
    try {
      const idUsuario = Number(req.params.id_usuario);
      const uuidCartao = String(req.params.cartao_uuid);
      const resultado = await this.cartoesService.deletarCartao(idUsuario, uuidCartao);
      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

}
