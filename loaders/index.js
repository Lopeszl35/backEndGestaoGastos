// loaders/index.js
import expressLoader from "./express.js";
import databaseLoader from "./database.js";
import containerLoader from "./container.js";
import routesLoader from "./routes.js";
import events from "events";

export default async ({ expressApp }) => {
  // Configuração global de eventos
  events.EventEmitter.defaultMaxListeners = 20;

  // 1. Conecta DB
  const database = await databaseLoader();

  // 2. Carrega Dependências (DI)
  await containerLoader({ database });

  // 3. Configura Express (Middlewares)
  await expressLoader({ app: expressApp });

  // 4. Carrega Rotas
  await routesLoader({ app: expressApp });

  // Retorna algo se necessário
  return { database };
};