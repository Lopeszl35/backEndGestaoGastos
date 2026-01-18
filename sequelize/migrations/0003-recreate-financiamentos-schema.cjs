"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // 1. DROP (Limpeza) - Ordem importa por causa das Foreign Keys
    // Se a coluna id_financiamento já foi criada em gastos (em testes anteriores), removemos a constraint primeiro
    try {
        await queryInterface.removeColumn("gastos", "id_financiamento").catch(() => {}); 
    } catch (e) { /* ignora se não existir */ }

    await queryInterface.dropTable("financiamento_parcelas");
    await queryInterface.dropTable("financiamentos");

    // 2. CREATE TABLE financiamentos (Cabeçalho do Contrato)
    await queryInterface.createTable("financiamentos", {
      id_financiamento: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        autoIncrement: true, 
        primaryKey: true 
      },
      id_usuario: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      titulo: { 
        type: DataTypes.STRING(120), 
        allowNull: false 
      },
      instituicao: { 
        type: DataTypes.STRING(120), 
        allowNull: true 
      },
      valor_total: { // Valor Original Contratado
        type: DataTypes.DECIMAL(12, 2), 
        allowNull: false 
      },
      valor_restante: { // Saldo Devedor Atual (Crucial para amortização)
        type: DataTypes.DECIMAL(12, 2), 
        allowNull: false 
      },
      numero_parcelas: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      parcelas_pagas: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        defaultValue: 0 
      },
      taxa_juros_mensal: { 
        type: DataTypes.DECIMAL(6, 4), // Ex: 1.5500
        allowNull: true 
      },
      sistema_amortizacao: { // PRICE ou SAC
        type: DataTypes.ENUM("PRICE", "SAC"), 
        allowNull: false, 
        defaultValue: "PRICE" 
      },
      data_inicio: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
      },
      dia_vencimento: { 
        type: DataTypes.TINYINT, 
        allowNull: false 
      },
      ativo: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
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

    // FK Usuario -> Financiamento
    await queryInterface.addConstraint("financiamentos", {
      fields: ["id_usuario"],
      type: "foreign key",
      name: "fk_fin_usuario_v2",
      references: { table: "usuarios", field: "id_usuario" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    await queryInterface.addIndex("financiamentos", ["id_usuario"], { name: "idx_fin_usuario_v2" });


    // 3. CREATE TABLE financiamento_parcelas (Detalhamento)
    await queryInterface.createTable("financiamento_parcelas", {
      id_parcela: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        autoIncrement: true, 
        primaryKey: true 
      },
      id_financiamento: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      id_usuario: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      numero_parcela: { // 1, 2, 3...
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      data_vencimento: { // Data exata calculada
        type: DataTypes.DATEONLY, 
        allowNull: false 
      },
      valor: { // Valor Total da Parcela (PMT)
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
      },
      valor_amortizacao: { // Quanto abate do principal
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      valor_juros: { // Quanto é lucro do banco
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      status: { 
        type: DataTypes.ENUM("aberta", "paga", "atrasada"), 
        allowNull: false, 
        defaultValue: "aberta" 
      },
      data_pagamento: { 
        type: DataTypes.DATEONLY, 
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

    // FKs Parcelas
    await queryInterface.addConstraint("financiamento_parcelas", {
      fields: ["id_financiamento"],
      type: "foreign key",
      name: "fk_parc_fin_v2",
      references: { table: "financiamentos", field: "id_financiamento" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("financiamento_parcelas", {
      fields: ["id_usuario"],
      type: "foreign key",
      name: "fk_parc_usuario_v2",
      references: { table: "usuarios", field: "id_usuario" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Index único: Não pode ter duas parcelas nº 1 para o mesmo financiamento
    await queryInterface.addConstraint("financiamento_parcelas", {
      fields: ["id_financiamento", "numero_parcela"],
      type: "unique",
      name: "uq_fin_num_parcela",
    });

    // 4. Alterar tabela GASTOS (Adicionar vínculo)
    // Agora que a tabela financiamentos nova existe, podemos vincular
    await queryInterface.addColumn("gastos", "id_financiamento", {
        type: DataTypes.INTEGER,
        allowNull: true,
        after: "id_gasto_fixo"
    });

    await queryInterface.addConstraint("gastos", {
        fields: ["id_financiamento"],
        type: "foreign key",
        name: "fk_gastos_financiamento_v2",
        references: { table: "financiamentos", field: "id_financiamento" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
    });
    
    await queryInterface.addIndex("gastos", ["id_financiamento"], { name: "idx_gastos_financiamento" });
  },

  async down(queryInterface, Sequelize) {
    // Reverter tudo (Cuidado em produção, aqui é dev)
    await queryInterface.removeColumn("gastos", "id_financiamento");
    await queryInterface.dropTable("financiamento_parcelas");
    await queryInterface.dropTable("financiamentos");
    // Nota: O down não recria as tabelas antigas, apenas apaga as novas.
    // Para voltar ao estado anterior, teria que rodar a migration 0001 de novo.
  }
};