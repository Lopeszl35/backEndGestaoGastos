import { CartaoCreditoModel } from "./cartoesCredito/CartaoCreditoModel.js";
import { CartaoFaturaModel } from "./cartoesCredito/CartaoFaturaModel.js";
import { CartaoLancamentoModel } from "./cartoesCredito/CartaoLancamentoModel.js";
import { AlertaModel } from "./alertas/AlertaModel.js";
import { UsuarioModel } from "./usuario/UsuarioModel.js";
import { CategoriasModel } from "./categorias/CategoriasModel.js";
import { GastosModel } from "./gastos/GastosModel.js";
import { TotalGastosMesModel } from "./gastos/TotalGastosMesModel.js"; 
import { GastosFixosModel } from "./gastosFixos/GastosFixosModel.js";
import { FinanciamentoModel } from "./financiamentos/FinanciamentoModel.js";
import { FinanciamentoParcelaModel } from "./financiamentos/FinanciamentoParcelaModel.js";
import { InvestimentoModel } from "./investimentos/InvestimentoModel.js";
import { ReceitaModel } from "./receitas/ReceitaModel.js";

export function configurarRelacionamentosModelos() {
  // --- Cartões ---
  CartaoCreditoModel.hasMany(CartaoFaturaModel, {
    foreignKey: "id_cartao",
    sourceKey: "idCartao",
  });

  CartaoCreditoModel.hasMany(CartaoLancamentoModel, {
    foreignKey: "id_cartao",
    sourceKey: "idCartao",
  });

  // --- Usuário & Cartões ---
  UsuarioModel.hasMany(CartaoCreditoModel, {
    foreignKey: "id_usuario",
    sourceKey: "idUsuario",
  });

  CartaoCreditoModel.belongsTo(UsuarioModel, {
    foreignKey: "id_usuario",
    targetKey: "idUsuario",
  });

  // --- Alertas ---
  AlertaModel.belongsTo(UsuarioModel, {
    foreignKey: "id_usuario",
    targetKey: "idUsuario",
  });

  // --- Usuário & Categorias ---
  UsuarioModel.hasMany(CategoriasModel, {
    foreignKey: "id_usuario",
    sourceKey: "idUsuario",
    as: "categorias" 
  });

  CategoriasModel.belongsTo(UsuarioModel, {
    foreignKey: "id_usuario",
    targetKey: "idUsuario",
    as: "usuario"
  });

  // --- Usuário & Gastos ---
  UsuarioModel.hasMany(GastosModel, { foreignKey: "id_usuario", as: "gastos" });
  GastosModel.belongsTo(UsuarioModel, { foreignKey: "id_usuario", as: "usuario" });

  // --- Usuário & Gastos Fixos ---
  UsuarioModel.hasMany(GastosFixosModel, { foreignKey: "id_usuario", as: "gastosFixos" });
  GastosFixosModel.belongsTo(UsuarioModel, { foreignKey: "id_usuario", as: "usuario" });

  // 1. GastoFixo <-> Gasto
  GastosFixosModel.hasMany(GastosModel, {
    foreignKey: "id_gasto_fixo",
    sourceKey: "idGastoFixo"
  })

  GastosModel.belongsTo(GastosFixosModel, {
    foreignKey: "id_gasto_fixo",
    targetKey: "idGastoFixo"
  })

  // 2. Gasto <-> Categoria 
  CategoriasModel.hasMany(GastosModel, { 
    foreignKey: "id_categoria", 
    as: "gastos" 
  });
  GastosModel.belongsTo(CategoriasModel, { 
    foreignKey: "id_categoria", 
    as: "categoria" 
  });

  // 3. Relacionamento Gasto <-> Cartão 
  CartaoCreditoModel.hasMany(GastosModel, { 
    foreignKey: "id_cartao", 
    as: "gastos" 
  });
  GastosModel.belongsTo(CartaoCreditoModel, { 
    foreignKey: "id_cartao", 
    as: "cartao" 
  });

  // --- Total Gastos Mês ---
  UsuarioModel.hasMany(TotalGastosMesModel, { 
    foreignKey: "id_usuario", 
    sourceKey: "idUsuario",
    as: "totaisGastosMes"
  });

  TotalGastosMesModel.belongsTo(UsuarioModel, { 
    foreignKey: "id_usuario", 
    targetKey: "idUsuario",
    as: "usuario" 
  });

  // Usuário <-> Financiamentos
  UsuarioModel.hasMany(FinanciamentoModel, { foreignKey: "id_usuario", as: "financiamentos" });
  FinanciamentoModel.belongsTo(UsuarioModel, { foreignKey: "id_usuario", as: "usuario" });

  // Financiamento <-> Parcelas (Cascade: se apagar financiamento, apaga parcelas)
  FinanciamentoModel.hasMany(FinanciamentoParcelaModel, { 
    foreignKey: "id_financiamento", 
    as: "parcelas",
    onDelete: "CASCADE"
  });
  FinanciamentoParcelaModel.belongsTo(FinanciamentoModel, { 
    foreignKey: "id_financiamento", 
    as: "financiamento" 
  });

  // Financiamento <-> Gastos (Histórico de pagamentos)
  // Um financiamento gera vários gastos (pagamentos de parcelas)
  FinanciamentoModel.hasMany(GastosModel, { 
    foreignKey: "id_financiamento", 
    as: "gastosGerados" 
  });
  GastosModel.belongsTo(FinanciamentoModel, { 
    foreignKey: "id_financiamento", 
    as: "financiamentoOrigem" 
  });

  InvestimentoModel.belongsTo(UsuarioModel, { 
    foreignKey: "id_usuario", as: "usuario" 
    });
  UsuarioModel.hasMany(InvestimentoModel, { 
    foreignKey: "id_usuario", as: "investimentos" 
  });

  ReceitaModel.belongsTo(UsuarioModel, {
    foreignKey: "id_usuario",
    as: "usuario"
  });

  UsuarioModel.hasMany(ReceitaModel, {
    foreignKey: "id_usuario",
    as: "receitas"
  });
}

export {
  CartaoCreditoModel,
  CartaoFaturaModel,
  CartaoLancamentoModel,
  AlertaModel,
  UsuarioModel,
  CategoriasModel,
  GastosModel,
  TotalGastosMesModel,
  GastosFixosModel,
  FinanciamentoModel,
  FinanciamentoParcelaModel,
  InvestimentoModel,
  ReceitaModel,
};