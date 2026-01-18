import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class FinanciamentoParcelaModel extends Model {}

FinanciamentoParcelaModel.init(
  {
    idParcela: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id_parcela",
    },
    idFinanciamento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_financiamento",
      references: { model: "financiamentos", key: "id_financiamento" },
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario",
    },
    numeroParcela: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "numero_parcela",
    },
    dataVencimento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "data_vencimento",
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    valorAmortizacao: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: "valor_amortizacao",
    },
    valorJuros: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: "valor_juros",
    },
    status: {
      type: DataTypes.ENUM("aberta", "paga", "atrasada"),
      allowNull: false,
      defaultValue: "aberta",
    },
    dataPagamento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "data_pagamento",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "financiamento_parcelas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);