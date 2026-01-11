import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class TotalGastosMesModel extends Model {}

TotalGastosMesModel.init(
  {
    id_total_gastos_mes: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario", // Mapeamento explícito
      references: {
        model: "usuarios",
        key: "id_usuario",
      },
    },
    ano: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mes: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    limiteGastoMes: { // CamelCase no JS
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: "limite_gasto_mes", // SnakeCase no Banco
    },
    gastoAtualMes: { // CamelCase no JS
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: "gasto_atual_mes", // SnakeCase no Banco
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    tableName: "total_gastos_mes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["id_usuario", "ano", "mes"],
      },
    ],
  }
);