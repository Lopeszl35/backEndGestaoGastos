"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // 1. Adicionar a coluna id_gasto_fixo na tabela gastos
    await queryInterface.addColumn("gastos", "id_gasto_fixo", {
      type: DataTypes.INTEGER(11),
      allowNull: true, // Pode ser nulo (nem todo gasto vem de um fixo)
      after: "id_categoria", 
    });

    // 2. Criar a Foreign Key
    await queryInterface.addConstraint("gastos", {
      fields: ["id_gasto_fixo"],
      type: "foreign key",
      name: "fk_gastos_gasto_fixo", // Nome da constraint
      references: {
        table: "gastos_fixos",
        field: "id_gasto_fixo",
      },
      onDelete: "SET NULL", // Se apagar o gasto fixo, mantém o histórico mas desvincula
      onUpdate: "CASCADE",
    });
    
    // 3. Criar índice para performance
    await queryInterface.addIndex("gastos", ["id_gasto_fixo"], {
        name: "idx_gastos_id_gasto_fixo"
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverter mudanças
    await queryInterface.removeConstraint("gastos", "fk_gastos_gasto_fixo");
    await queryInterface.removeIndex("gastos", "idx_gastos_id_gasto_fixo");
    await queryInterface.removeColumn("gastos", "id_gasto_fixo");
  },
};