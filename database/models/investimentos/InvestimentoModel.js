import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class InvestimentoModel extends Model {}

InvestimentoModel.init(
  {
    idInvestimento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id_investimento",
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario",
      references: { model: "usuarios", key: "id_usuario" },
    },
    tipo: {
      type: DataTypes.ENUM('ACAO', 'FII', 'CDB', 'TESOURO', 'CRIPTO', 'OUTRO'),
      allowNull: false,
    },
    ticker: { // Ex: PETR4, BTC
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    nome: { // Ex: Petrobras PN
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.DECIMAL(18, 8), // 8 casas decimais para cripto
      allowNull: false,
    },
    precoMedio: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "preco_medio",
    },
    valorTotalInvestido: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "valor_total_investido",
    },
    dataCompra: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "data_compra",
    },
    instituicao: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    tableName: "investimentos",
    timestamps: true,
  }
);