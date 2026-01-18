"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // Altera a coluna id_categoria na tabela gastos para permitir NULL
    // Isso permite inserir gastos que vêm de Financiamentos (que não possuem categoria_gastos)
    await queryInterface.changeColumn("gastos", "id_categoria", {
      type: DataTypes.INTEGER,
      allowNull: true, // <--- AQUI ESTÁ A MÁGICA
      references: { model: "categorias_gastos", key: "id_categoria" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverte para obrigatório (Cuidado: vai falhar se tiver dados nulos)
    await queryInterface.changeColumn("gastos", "id_categoria", {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "categorias_gastos", key: "id_categoria" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
};