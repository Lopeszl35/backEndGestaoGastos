import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class CategoriasModel extends Model {}

CategoriasModel.init(
    {
        id_categoria: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false,
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
        data_criacao: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        inativado_em: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        trableName: "categorias_gastos",
    }
)

export default CategoriasModel