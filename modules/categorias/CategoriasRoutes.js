import express from "express";
import cors from "cors";
import verifyToken from "../../middleware/verifyToken.js";
import {
  validateCreateCategoria,
  validateGetCategorias,
  validateDeleteCategoria,
  validateUpdateCategoria,
} from "./categoriasValidade.js";

const router = express.Router();
router.use(cors());

export default (categoriasController) => {
  router.post("/criarCategoria/:id_usuario", verifyToken, validateCreateCategoria, (req, res, next) => {
    categoriasController.createCategorias(req, res, next);
  });

  router.get("/getCategoriasAtivas/:id_usuario", verifyToken, validateGetCategorias, (req, res, next) => {
    categoriasController.getCategoriasAtivas(req, res, next);
  });

  router.get("/getCategoriasInativas/:id_usuario", verifyToken, (req, res, next) => {
    categoriasController.getCategoriasInativas(req, res, next);
  });

  router.delete("/deleteCategorias", verifyToken, validateDeleteCategoria, (req, res, next) => {
    categoriasController.deleteCategoria(req, res, next);
  });

  router.patch("/categorias/:id_categoria/reativar", verifyToken, (req, res, next) => {
    categoriasController.reativarCategoria(req, res, next);
  });

  router.patch("/updateCategoria", verifyToken, validateUpdateCategoria, (req, res, next) => {
    categoriasController.updateCategoria(req, res, next);
  });

  return router;
};
