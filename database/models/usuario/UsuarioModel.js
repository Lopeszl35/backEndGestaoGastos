import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../sequelize.js";

export class UsuarioModel extends Model {}

UsuarioModel.init(
    {
        idUsuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_usuario",
        },
        nome: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        senhaHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "senha_hash",
        },
        perfilFinanceiro: {
            type: DataTypes.ENUM("conservador", "moderado", "arrojado"),
            allowNull: true,
            defaultValue: "moderado",
            field: "perfil_financeiro",
        },
        salarioMensal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.0,
            field: "salario_mensal",
        },
        saldoInicial: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.0,
            field: "saldo_inicial",
        },
        saldoAtual: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "saldo_atual",
        },
        dataCadastro: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "data_cadastro",
        },
    },
    {
        sequelize,
        tableName: "usuarios",
        timestamps: false,
    }
)