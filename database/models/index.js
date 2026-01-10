import { CartaoCreditoModel } from "./cartoesCredito/CartaoCreditoModel.js";
import { CartaoFaturaModel } from "./cartoesCredito/CartaoFaturaModel.js";
import { CartaoLancamentoModel } from "./cartoesCredito/CartaoLancamentoModel.js";
import { AlertaModel } from "./alertas/AlertaModel.js";
import { UsuarioModel } from "./usuario/UsuarioModel.js";

export function configurarRelacionamentosModelos() {
  CartaoCreditoModel.hasMany(CartaoFaturaModel, {
    foreignKey: "id_cartao",
    sourceKey: "idCartao",
  });

  CartaoCreditoModel.hasMany(CartaoLancamentoModel, {
    foreignKey: "id_cartao",
    sourceKey: "idCartao",
  });

  UsuarioModel.hasMany(CartaoCreditoModel, {
    foreignKey: "id_usuario",
    sourceKey: "idUsuario",
  });

  CartaoCreditoModel.belongsTo(UsuarioModel, {
    foreignKey: "id_usuario",
    targetKey: "idUsuario",
  });
}

export {
  CartaoCreditoModel,
  CartaoFaturaModel,
  CartaoLancamentoModel,
  AlertaModel,
  UsuarioModel,
};
