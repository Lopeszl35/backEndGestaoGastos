'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable("refresh_tokens", {
      token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id_usuario" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("refresh_tokens");
    
  }
};
