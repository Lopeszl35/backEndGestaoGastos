import NaoEncontrado from "../../errors/naoEncontrado.js";
import { matchedData } from "express-validator";

class UserController {
  constructor(UserService, TransactionUtil) {
    this.UserService = UserService;
    this.TransactionUtil = TransactionUtil;
  }

  async createUser(req, res, next) {
    const { user } = matchedData(req, { locations: ["body"] });
    try {
      const response = await this.UserService.createUser(user);
      if (!response.insertId) {
        throw new Error("Erro ao criar o usuário: " + JSON.stringify(response));
      }
      res.status(201).json({
        message: "Usuário criado com sucesso",
        status: 201,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async atualizarUsuario(req, res, next) {
    try {
      const { userId } = matchedData(req, { locations: ["params"] });
      const { user } = matchedData(req, { locations: ["body"] });

      const result = await this.UserService.atualizarUsuario(
        Number(userId),
        user
      );

      res.status(200).json({
        message: "Usuário atualizado com sucesso",
        status: 200,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async loginUser(req, res, next) {
    const { email, senha } = matchedData(req, { locations: ["body"] });
    try {
      const result = await this.UserService.loginUser(email, senha);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    const { userId } = matchedData(req, { locations: ["params"] });
    try {
      const result = await this.UserService.deleteUser(userId);
      res.status(200).json({
        message: "Usuário deletado com sucesso",
        status: 200,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserSaldo(req, res, next) {
    const { userId } = matchedData(req, { locations: ["query"] });
    try {
      const saldo = await this.UserService.getUserSaldo(userId);
      res.status(200).json( saldo );
    } catch (error) {
      next(error);
    }
  }

  async atualizarUserSaldo(req, res, next) {
    try {
      const { userId, saldo } = matchedData(req, { locations: ["body"] });
      const result = await this.UserService.atualizarUserSaldo(userId, saldo);
      res.status(200).json(result);
    } catch (erro) {
      next(erro);
    }
  }

  async getUserData(req, res, next) {
    try {
      const { userId } = req.params;
      const userData = await this.UserService.getUser(userId);
      if (!userData) {
        throw new NaoEncontrado("Usuário não encontrado");
      }
      res.status(200).json(userData);
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
