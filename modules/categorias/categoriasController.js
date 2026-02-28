import { matchedData } from "express-validator";


class CategoriasController {
  constructor(CategoriasService, TransactionUtil) {
    this.CategoriasService = CategoriasService;
    this.TransactionUtil = TransactionUtil;
  }

  async createCategorias(req, res, next) {
    try {
      const id_usuario = req.userId;;
      const categoria = matchedData(req, { locations: ["body"] }).categoria;
      
      const result = await this.TransactionUtil.executeTransaction(
        async (connection) => {
          return await this.CategoriasService.createCategoria(
            categoria,
            Number(id_usuario),
            connection
          );
        }
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateCategoria(req, res, next) {
    const id_usuario = req.userId;
    const { id_categoria } = req.params;
    const categoria = matchedData(req, { locations: ["body"] }).categoria;
    try {
      const result = await this.TransactionUtil.executeTransaction(
        async (connection) => {
          return await this.CategoriasService.updateCategoria(
            id_categoria,
            id_usuario,
            categoria,
            connection
          );
        }
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategoria(req, res, next) {
    const id_usuario = req.userId;
    const { id_categoria } = req.params;
    const dataAtual = new Date();
    
    try {
      await this.TransactionUtil.executeTransaction(
        async (connection) => {
          return await this.CategoriasService.deleteCategoria(
            id_categoria,
            id_usuario,
            dataAtual,
            connection
          );
        }
      );
      res.status(200).json({
        message: "Categoria deletada com sucesso",
        status: 200,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoriasAtivas(req, res, next) {
    const id_usuario = req.userId;
    const ano = req.query.ano ? Number(req.query.ano) : null;
    const mes = req.query.mes ? Number(req.query.mes) : null;

    try {
      const result = await this.CategoriasService.getCategoriasAtivas(id_usuario, ano, mes);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCategoriasInativas(req, res, next) {
    const id_usuario = req.userId;
    try {
      const result = await this.CategoriasService.getCategoriasInativas(id_usuario);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async reativarCategoria(req, res, next) {
    const { id_categoria } = req.params;
    const id_usuario = req.userId;

    try {
      const result = await this.TransactionUtil.executeTransaction(
        async (connection) => {
          return await this.CategoriasService.reativarCategoria(
            id_categoria,
            id_usuario,
            connection
          );
        }
      );
      res.status(200).json({
        message: "Categoria reativada com sucesso",
        status: 200,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CategoriasController;