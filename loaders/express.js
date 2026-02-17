// loaders/express.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import helmet from "helmet"; // SEGURANÇA
import rateLimit from "express-rate-limit"; // PROTEÇÃO CONTRA DDOS
import manipulador404 from "../middleware/manipulador404.js";
import manipuladorDeErros from "../middleware/manipuladorDeErros.js";

export default ({ app }) => {
  // 1. Proxy reverso (Essencial se rodar atrás de Nginx/Cloudflare/Heroku/AWS)
  app.set('trust proxy', 1);

  // 2. Segurança Básica (Headers HTTP)
  app.use(helmet());

  // 3. Rate Limiting (Protege contra força bruta e DoS simples)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 reqs por IP por janela
    message: "Muitas requisições criadas a partir deste IP, tente novamente mais tarde.",
    standardHeaders: true, 
    legacyHeaders: false,
  });
  // Aplica o limitador em todas as rotas (pode ser específico apenas para /auth se preferir)
  app.use(limiter);

  // 4. Configurações de Parsing e Logs
  app.use(express.json());
  app.use(morgan("dev")); // Log de desenvolvimento

  // 5. CORS (Cross-Origin Resource Sharing)
  app.use(
    cors({
      origin: "*", 
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // 6. Gestão de Sessão (Se estiver usando sessão server-side)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "chave_secreta_padrao_dev", // Fallback seguro para dev
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 dia
        secure: process.env.NODE_ENV === 'production', // HTTPS obrigatório em produção
        httpOnly: true, // Protege contra XSS (JS não lê o cookie)
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Ajuste conforme seu frontend
      },
    })
  );

  return app;
};