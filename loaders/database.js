// loaders/database.js
import DependencyInjector from "../utils/DependencyInjector.js";

export default async () => {
  console.log("📡 Conectando ao Banco de Dados...");
  
  const { default: Database } = await import("../database/connection.js");
  const database = Database.getInstance();
  
  // Registra no container
  DependencyInjector.register("Database", database);

  const { testarConexaoSequelize } = await import("../database/sequelize.js");
  const { configurarRelacionamentosModelos } = await import("../database/models/index.js");

  await testarConexaoSequelize();
  configurarRelacionamentosModelos();

  console.log("✅ Database conectado e modelos configurados.");
  
  return database;
};