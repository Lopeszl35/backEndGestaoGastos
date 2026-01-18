import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class GastosFixosModel extends Model {}

GastosFixosModel.init(
    {
        idGastoFixo: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_gasto_fixo",
        },
        idUsuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_usuario",
            references: {
                model: "usuarios",
                key: "id_usuario",
            }
        },
        tipo: {
            type: DataTypes.ENUM("luz", "agua", "internet", "assinatura", "telefone", "streaming", "academia", "outros"),
            allowNull: false,
        },
        titulo: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        descricao: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        diaVencimento: {
            type: DataTypes.TINYINT,
            allowNull: false,
            field: "dia_vencimento",
        }, 
        recorrencia: {
            type: DataTypes.ENUM("mensal", "anual", "bimestral", "trimestral"),
            allowNull: false,
        },
        ativo: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1,
            field: "ativo",
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),   
            field: "created_at",
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            field: "updated_at",
        },

    },
    {
        sequelize,
        tableName: "gastos_fixos",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
)