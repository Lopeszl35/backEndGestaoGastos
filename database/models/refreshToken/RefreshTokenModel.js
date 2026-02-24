import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database/sequelize.js"; // Ajuste o caminho se necessário

export class RefreshTokenModel extends Model {}

RefreshTokenModel.init(
    {
        token: {
            type: DataTypes.STRING(64),
            allowNull: false,
            primaryKey: true,
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "usuarios", key: "id_usuario" },
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        revoked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        modelName: "RefreshToken",
        tableName: "refresh_tokens",
        timestamps: true, // Habilita o controle automático
        updatedAt: "updated_at", // Ensina o ORM a usar snake_case para gravar no banco
        createdAt: "created_at",
    }
);