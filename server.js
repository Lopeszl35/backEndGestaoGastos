import express from "express";
import dotenv from "dotenv";
import loaders from "./loaders/index.js"; // Importa o orquestrador

// Carrega variáveis de ambiente imediatamente
dotenv.config();
// Verificação de segurança para JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("🔥 FATAL ERROR: JWT_SECRET não definido ou muito fraco. A aplicação foi abortada.");
  console.error("Gere um hash forte de 64 bytes e coloque no seu arquivo .env.");
  process.exit(1); // Derruba o processo Node.js imediatamente (Kill Signal)
}

async function startServer() {  
  console.log("🚀 Inicializando servidor...");

  const app = express();

  try {
    // BOOTSTRAP: Carrega toda a infraestrutura (DB, DI, Express, Rotas)
    await loaders({ expressApp: app });

    const PORT = process.env.SERVER_PORT || 3000;
    const HOST = process.env.SERVER_HOST || "localhost";

    app.listen(PORT, HOST, () => {
      console.log(`
      ################################################
      🛡️  Servidor rodando em: http://${HOST}:${PORT} 🛡️
      ################################################
      `);
    });

  } catch (error) {
    console.error("❌ Erro fatal ao iniciar o servidor:");
    console.error(error);
    process.exit(1);
  }
}

startServer();