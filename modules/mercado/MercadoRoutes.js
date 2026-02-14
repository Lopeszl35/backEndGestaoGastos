import { Router } from "express";

export default (Controller) => {
  const router = Router();
  router.get("/cotacoes", (req, res, next) => Controller.getCotacao(req, res, next));
  router.get("/noticias", (req, res, next) => Controller.getNoticias(req, res, next));
  return router;
};