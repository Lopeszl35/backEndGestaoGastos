// loaders/express.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet"; // BLINDAGEM DE HEADERS
import rateLimit from "express-rate-limit"; // PROTEÇÃO DDOS
import compression from "compression";

export default ({ app }) => {
  // 1. Proxy reverso (Essencial para IP real atrás de Load Balancers)
  app.set('trust proxy', 1);

  // 2. Segurança Básica (Headers HTTP)
  app.use(helmet());

  app.use(compression({
    level: 6, // Nível de compressão (1-9). 6 é um bom equilíbrio entre compressão e desempenho.
    threshold: 1024, // Comprime respostas maiores que 1KB
  }))

  // 3. Rate Limiting (Ajustado para realidade Mobile / CGNAT)
  // Aplica um limite mais tolerante globalmente. Rotas sensíveis (como /login) 
  // devem ter seus próprios limitadores mais agressivos lá nas rotas.
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Mais permissivo devido ao CGNAT das redes móveis
    message: { error: "Muitas requisições. Tente novamente mais tarde." },
    standardHeaders: true, 
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // 4. Configurações de Parsing COM SANITIZAÇÃO DE TAMANHO
  // 🛡️ Impede ataques de alocação de memória (Payloads excessivos)
  app.use(express.json({ limit: "500kb" })); 
  app.use(express.urlencoded({ extended: true, limit: "500kb" }));
  
  app.use(morgan("dev")); 

  // 5. CORS (Estritamente fechado para Web)
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) {
          callback(null, true);
        } else {
          callback(new Error("Acesso negado: API estritamente mobile."));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false, 
    })
  );

  
  return app;
};