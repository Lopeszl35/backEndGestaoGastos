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
            comment: "Data em que o dinheiro efetivamente caiu (ou cairá) na conta"
        },
        
        // --- NOVOS CAMPOS ESTRATÉGICOS PARA IA ---
        
        tipo: {
            type: DataTypes.ENUM(
                'SALARIO', 
                'FREELANCE', 
                'RENDIMENTO_INVESTIMENTO', 
                'CASHBACK', 
                'VENDA_ATIVO', 
                'DOACAO', 
                'OUTRO'
            ),
            allowNull: false,
            defaultValue: 'OUTRO',
            field: "tipo",
        },
        status: {
            type: DataTypes.ENUM('PREVISTA', 'EFETIVADA', 'CANCELADA'),
            allowNull: false,
            defaultValue: 'EFETIVADA',
            field: "status",
            comment: "Crucial para projeção de fluxo de caixa futuro"
        },
        isFixa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_fixa",
            comment: "True para salários/aluguéis. False para bicos/vendas."
        },
        instituicaoOrigem: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "instituicao_origem",
            comment: "Nome do empregador, corretora, ou cliente"
        },
        idInvestimento: {
            type: DataTypes.INTEGER,
            allowNull: true, // Nullable pois nem toda receita vem de investimento
            field: "id_investimento",
            references: {
                model: "investimentos", 
                key: "id_investimento",
            },
            onDelete: "SET NULL", // Se deletar o investimento, mantém a receita como histórico
            onUpdate: "CASCADE"
        },
        
        // ----------------------------------------

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
        indexes: [
            // Índices para otimizar queries da IA (Complexidade O(log n))
            {
                name: "idx_receitas_usuario_data",
                fields: ["id_usuario", "data_receita"]
            },
            {
                name: "idx_receitas_status",
                fields: ["id_usuario", "status"]
            }
        ]
    }
);