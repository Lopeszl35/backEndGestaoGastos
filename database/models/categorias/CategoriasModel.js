import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class CategoriasModel extends Model {}

CategoriasModel.init(
  {
    idCategoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id_categoria",
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario",
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nomeNormalizado: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "nome_normalizado", 
    },
    limite: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    dataCriacao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "data_criacao",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
    inativadoEm: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "inativado_em",
    },
  },
  {
    sequelize,
    tableName: "categorias_gastos", 
    timestamps: true, 
    createdAt: "dataCriacao",
    updatedAt: "updatedAt",   
  }
);