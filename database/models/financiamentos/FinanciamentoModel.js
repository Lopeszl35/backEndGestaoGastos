import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class FinanciamentoModel extends Model {}

FinanciamentoModel.init(
  {
    idFinanciamento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id_financiamento",
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario",
      references: { model: "usuarios", key: "id_usuario" },
    },
    titulo: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    instituicao: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    valorTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "valor_total",
    },
    valorRestante: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "valor_restante",
    },
    numeroParcelas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "numero_parcelas",
    },
    parcelasPagas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "parcelas_pagas",
    },
    taxaJurosMensal: {
      type: DataTypes.DECIMAL(6, 4),
      allowNull: true,
      field: "taxa_juros_mensal",
    },
    sistemaAmortizacao: {
      type: DataTypes.ENUM("PRICE", "SAC"),
      allowNull: false,
      defaultValue: "PRICE",
      field: "sistema_amortizacao",
    },
    dataInicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "data_inicio",
    },
    diaVencimento: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: "dia_vencimento",
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "financiamentos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);