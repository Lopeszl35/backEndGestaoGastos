'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('usuarios');
    
   
    if (!tableInfo.deleted_at) {
      await queryInterface.addColumn('usuarios', 'deleted_at', {
        type: Sequelize.DATE,
        
        // 🛡️ REGRA DE NEGÓCIO: Se for NULL, a conta está ATIVA. Se tiver data, está DELETADA (Soft Delete).
        allowNull: true,
        defaultValue: null,
        
        // Excelente prática de governança de dados (documentação no próprio MySQL)
        comment: 'Coluna de Soft Delete para retenção de histórico financeiro'
      });
    }
  },

  // O método DOWN é executado se você precisar dar um Rollback: npx sequelize-cli db:migrate:undo
  async down (queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('usuarios');
    
    // 🛡️ A reversão também precisa ser idempotente
    if (tableInfo.deleted_at) {
      await queryInterface.removeColumn('usuarios', 'deleted_at');
    }
  }
};