import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../sequelize.js"; 

export class ReceitaModel extends Model {}

ReceitaModel.init(
    {
        idReceita: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_receita",
        },
        idUsuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_usuario",
            references: {
                model: "usuarios",
                key: "id_usuario",
            },
        },
        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        dataReceita: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "data_receita",
        },
        descricao: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        origemLancamento: {
            type: DataTypes.STRING(30),
            defaultValue: "manual",
            field: "origem_lancamento",
        },
        metadadosJson: {
            type: DataTypes.TEXT("long"),
            allowNull: true,
            field: "metadados_json",
        },
        criadoEm: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "criado_em",
        },
        atualizadoEm: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "atualizado_em",
        },
    },
    {
        sequelize,
        tableName: "receitas",
        timestamps: true,
        createdAt: "criadoEm",
        updatedAt: "atualizadoEm",
    }
);