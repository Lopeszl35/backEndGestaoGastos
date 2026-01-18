// loaders/express.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import manipulador404 from "../middleware/manipulador404.js";
import manipuladorDeErros from "../middleware/manipuladorDeErros.js";

export default ({ app }) => {
  // Configurações básicas
  app.use(express.json());
  app.use(
    cors({
      origin: "*", 
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
  app.use(morgan("dev"));

  // Sessão
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 dia
        secure: false, // Mude para true em prod
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  return app;
};