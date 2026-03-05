// loaders/database.js
import DependencyInjector from "../utils/DependencyInjector.js";
import { sequelize, testarConexaoSequelize } from "../database/sequelize.js";
import * as models from "../database/models/index.js";

export default async () => {
  console.log("📡 Conectando ao Banco de Dados...");
  
  // 1. Testa a conexão com o Sequelize
  await testarConexaoSequelize();
  
  // 2. Configura as relações (hasMany, belongsTo...)
  models.configurarRelacionamentosModelos();

  // 🛡️ ADAPTER PATTERN: Montamos um objeto que se comporta exatamente como a classe antiga,
  // mas expõe o Sequelize e todos os Models para os novos repositórios.
  const database = {
    sequelize, 
    ...models,

    // Retrocompatibilidade: Isso impede que o utils/TransactionUtil.js quebre
    async beginTransaction() {
      return await sequelize.transaction();
    },
    async commitTransaction(transaction) {
      if (transaction) await transaction.commit();
    },
    async rollbackTransaction(transaction) {
      if (transaction) await transaction.rollback();
    },

    // Retrocompatibilidade: Isso impede que Repositórios legados (ex: Alertas) quebrem
    async executaComando(sql, params = []) {
      const [rows] = await sequelize.query(sql, { bind: params });
      return rows;
    },
    async executaComandoNonQuery(sql, params = []) {
      const [results, metadata] = await sequelize.query(sql, { bind: params });
      return metadata?.affectedRows || 0;
    }
  };

  // Registra no container para uso global
  DependencyInjector.register("Database", database);

  console.log("✅ Database conectado e modelos configurados.");
  
  // Retornamos o objeto híbrido. Ele tem o poder do Sequelize e a familiaridade da interface antiga 
  // nem vão perceber que você mudou a arquitetura do banco inteiro por baixo dos panos!
  return database;
};