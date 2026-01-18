import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class GastosModel extends Model {}

GastosModel.init(
    {
        id_gasto: {
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
        id_categoria: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "categorias_gastos", // Nome da tabela no banco
                key: "id_categoria",
            },
        },
        id_gasto_fixo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "gastos_fixos",
                key: "id_gasto_fixo",
            },
        },
        descricao: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        origem_lancamento: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: "MANUAL"
        },
        metadados_json: {
            type: DataTypes.JSON, // O Sequelize converte auto para string/json
            allowNull: true,
        },
        descricao_normalizada: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        forma_pagamento: {
            type: DataTypes.ENUM('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO'),
            allowNull: false,
            defaultValue: 'DINHEIRO',
        },
        id_cartao: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "cartoes_credito", // Nome da tabela no banco
                key: "id_cartao",
            },
        },
        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        data_gasto: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        criado_em: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        atualizado_em: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
    },
    {
        sequelize,
        tableName: "gastos",
        timestamps: true,
        createdAt: "criado_em",
        updatedAt: "atualizado_em",
    }
)