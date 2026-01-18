import { DataTypes } from 'sequelize';
import { sequelize } from '../../sequelize.js';

const ReceitaModel = sequelize.define('Receita', {
    id_receita: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    data_receita: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    descricao: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    origem_lancamento: {
        type: DataTypes.STRING(30),
        defaultValue: "manual"
    },
    // Adicione outros campos se necessário conforme sua migration
}, {
    tableName: 'receitas',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
});

export default ReceitaModel;