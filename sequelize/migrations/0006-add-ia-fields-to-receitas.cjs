"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // 1. Adicionando as colunas
    await queryInterface.addColumn("receitas", "tipo", {
      type: DataTypes.ENUM('SALARIO', 'FREELANCE', 'RENDIMENTO_INVESTIMENTO', 'CASHBACK', 'VENDA_ATIVO', 'DOACAO', 'OUTRO'),
      allowNull: false,
      defaultValue: 'OUTRO'
    });

    await queryInterface.addColumn("receitas", "status", {
      type: DataTypes.ENUM('PREVISTA', 'EFETIVADA', 'CANCELADA'),
      allowNull: false,
      defaultValue: 'EFETIVADA'
    });

    await queryInterface.addColumn("receitas", "is_fixa", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn("receitas", "instituicao_origem", {
      type: DataTypes.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn("receitas", "id_investimento", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "investimentos",
        key: "id_investimento"
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    });

    // 2. Adicionando Índices de Performance
    await queryInterface.addIndex("receitas", ["id_usuario", "data_receita"], {
      name: "idx_receitas_usuario_data"
    });

    await queryInterface.addIndex("receitas", ["id_usuario", "status"], {
      name: "idx_receitas_status"
    });
  },

  async down(queryInterface, Sequelize) {
    // Ordem inversa para rollback
    await queryInterface.removeIndex("receitas", "idx_receitas_status");
    await queryInterface.removeIndex("receitas", "idx_receitas_usuario_data");
    
    // O Sequelize exige o nome da constraint para remover a FK corretamente
    await queryInterface.removeConstraint("receitas", "receitas_id_investimento_foreign_idx"); // O nome pode variar, idealmente seria fk_receitas_investimento
    
    await queryInterface.removeColumn("receitas", "id_investimento");
    await queryInterface.removeColumn("receitas", "instituicao_origem");
    await queryInterface.removeColumn("receitas", "is_fixa");
    await queryInterface.removeColumn("receitas", "status");
    await queryInterface.removeColumn("receitas", "tipo");
  }
};