import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../sequelize.js";
// Preparando para receber refatoração
//import { User } from "../usuario/UserModel.js";

export class AlertaModel extends Model {}

AlertaModel.init(
  {
    id_alerta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios", // Nome da tabela no banco
        key: "id_usuario",
      },
    },
    tipo_alerta: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    severidade: {
      type: DataTypes.STRING(15), // 'ALTA', 'MEDIA', 'BAIXA'
      allowNull: false,
    },
    mensagem: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    dados_json: {
      type: DataTypes.JSON, // O Sequelize converte auto para string/json
      allowNull: true,
    },
    visto_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "alertas_financeiros",
    timestamps: false,
  }
);

