"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable("investimentos", {
      id_investimento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id_usuario" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      tipo: {
        type: DataTypes.ENUM('ACAO', 'FII', 'CDB', 'TESOURO', 'CRIPTO', 'OUTRO'),
        allowNull: false
      },
      ticker: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "Código do ativo (ex: PETR4, BTC)"
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      quantidade: {
        type: DataTypes.DECIMAL(18, 8), // 8 casas decimais para suportar frações de cripto
        allowNull: false
      },
      preco_medio: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false
      },
      valor_total_investido: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false
      },
      data_compra: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      instituicao: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    // Cria um índice para deixar a busca por usuário mais rápida
    await queryInterface.addIndex("investimentos", ["id_usuario"], {
      name: "idx_investimentos_usuario"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("investimentos");
  }
};