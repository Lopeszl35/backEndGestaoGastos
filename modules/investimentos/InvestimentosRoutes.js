import { Router } from "express";


export default (Controller) => {
  const router = Router();
  
  router.post("/criar", (req, res, next) => Controller.criar(req, res, next));
  router.get("/dashboard", (req, res, next) => Controller.getDashboard(req, res, next));
  router.delete("/:id", (req, res, next) => Controller.deletar(req, res, next));
  
  return router;
};