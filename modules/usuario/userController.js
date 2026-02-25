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
      const userId = req.userId; // O ID do usuário autenticado é extraído do token pelo middleware de autenticação
      const { user } = matchedData(req, { locations: ["body"] });

      await this.UserService.atualizarUsuario(userId, user);

      res.status(200).json({
        message: "Usuário atualizado com sucesso",
        status: 200,
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

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = matchedData(req, { locations: ["body"] }); 
      
      const tokens = await this.UserService.refreshAccessToken(refreshToken);
      
      res.status(200).json({
        message: "Sessão renovada com sucesso.",
        status: 200,
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = matchedData(req, { locations: ["body"] });
      
      await this.UserService.logout(refreshToken);
      
      res.status(200).json({
        message: "Logout efetivado.",
        status: 200
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    const userId = req.userId;
    try {
      await this.UserService.deleteUser(userId);
      res.status(200).json({
        message: "Usuário deletado com sucesso",
        status: 200,
      });
    } catch (error) {
      next(error);
    }
  }

  /*
  ❌ MÉTODO REMOVIDO: atualizarUserSaldo
  TODO: Este métdo será transferido para o controller de receitas/gastos, pois o saldo do usuário deve ser manipulado indiretamente por meio de transações financeiras, e não diretamente por uma rota de usuário.
  async getUserSaldo(req, res, next) {
    const userId = req.userId;
    try {
      const saldo = await this.UserService.getUserSaldo(userId);
      if (!saldo) {
        throw new NaoEncontrado("Saldo do usuário não encontrado");
      }
      res.status(200).json( saldo );
    } catch (error) {
      next(error);
    }
  }
    */

  /*
  ❌ MÉTODO REMOVIDO: atualizarUserSaldo
  // TODO: Este métdo será transferido para o controller de receitas/gastos, pois o saldo do usuário deve ser manipulado indiretamente por meio de transações financeiras, e não diretamente por uma rota de usuário.
  // O saldo deve ser alterado indiretamente por outras rotas de domínio financeiro 
  // (ex: adicionarGastos, registrarReceita, pagarFatura), 
  // que chamam os métodos de debitar/aumentarSaldo da UsuarioEntity internamente.
  async atualizarUserSaldo(req, res, next) {
    try {
      const { userId, saldo } = matchedData(req, { locations: ["body"] });
      const result = await this.UserService.atualizarUserSaldo(userId, saldo);
      res.status(200).json(result);
    } catch (erro) {
      next(erro);
    }
  }
  */

  async getUserData(req, res, next) {
    try {
      const userId = req.userId;
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
