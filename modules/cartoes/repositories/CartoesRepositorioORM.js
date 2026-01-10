import { CartaoCreditoModel } from "../../../database/models/index.js";

export class CartoesRepositorioORM {
  async listarCartoesAtivosPorUsuario(idUsuario) {
    return CartaoCreditoModel.findAll({
      where: { idUsuario, ativo: true },
      order: [["created_at", "DESC"]],
    });
  }

  async buscarCartaoPorUuidEUsuario(uuidCartao, idUsuario) {
    return CartaoCreditoModel.findOne({
      where: { uuid_cartao: uuidCartao, idUsuario, ativo: true },
    });
  }

   async buscarCartaoPorUuidEUsuarioAtivoOuInativo(uuidCartao, idUsuario) {
    return CartaoCreditoModel.findOne({
      where: { uuid_cartao: uuidCartao, idUsuario },
    });
  }

  async existeCartaoAtivoIgual({idUsuario, nomeNorm, bandeiraNorm, ultimos4Norm}) {
    const encontrado = await CartaoCreditoModel.findOne({
      where: {
        idUsuario,
        ativo: true,
        nomeNorm,
        bandeiraNorm,
        ultimos4Norm,
      },
    });

    return Boolean(encontrado);

  }

  async criarCartaoParaUsuario({
    idUsuario,
    uuidCartao,
    nome,
    bandeira,
    ultimos4,
    corHex,
    limite,
    diaFechamento,
    diaVencimento,
    nomeNorm,
    bandeiraNorm,
    ultimos4Norm,
  }) {
    const criado = await CartaoCreditoModel.create({
        idUsuario,
        uuidCartao,
        nome,
        bandeira,
        ultimos4,
        corHex,
        limite,
        diaFechamento,
        diaVencimento,
        ativo: true,
        nomeNorm,
        bandeiraNorm,
        ultimos4Norm,
    });
    return criado;
  }

  async ativarDesativarCartao({ idCartao, ativar }) {
    const cartao = await CartaoCreditoModel.findByPk(idCartao);
    cartao.ativo = ativar;
    await cartao.save();
    return cartao;
  }

  async restaurarLimite({ idCartao, valor }) {
    const cartao = await CartaoCreditoModel.findByPk(idCartao);
    cartao.limite = cartao.limite + valor;
    await cartao.save();
    return cartao;
  }

}

