import express from "express";
import verifyToken from "../../middleware/verifyToken.js";
import {
  validateCreateCategoria,
  validateGetCategorias,
  validateDeleteCategoria,
  validateUpdateCategoria,
} from "./categoriasValidate.js";

const router = express.Router();

export default (categoriasController) => {
  router.post("/categoria", verifyToken, validateCreateCategoria, (req, res, next) => {
    categoriasController.createCategorias(req, res, next);
  });

  router.get("/categorias/ativas", verifyToken, validateGetCategorias, (req, res, next) => {
    categoriasController.getCategoriasAtivas(req, res, next);
  });

  router.get("/categorias/inativas", verifyToken, (req, res, next) => {
    categoriasController.getCategoriasInativas(req, res, next);
  });

  router.delete("/categorias/:id_categoria", verifyToken, validateDeleteCategoria, (req, res, next) => {
    categoriasController.deleteCategoria(req, res, next);
  });

  router.patch("/categorias/:id_categoria/reativar", verifyToken, (req, res, next) => {
    categoriasController.reativarCategoria(req, res, next);
  });

  router.patch("/categorias/:id_categoria", verifyToken, validateUpdateCategoria, (req, res, next) => {
    categoriasController.updateCategoria(req, res, next);
  });

  return router;
};
