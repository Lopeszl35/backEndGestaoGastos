import { UsuarioModel } from "../../database/models/index.js";
import NaoEncontrado from "../../errors/naoEncontrado.js";

class UserRepository {

  // Agora apenas atualiza, a validação de saldo é feita antes.
  async diminuirSaldoAtual({ id_usuario, valor, connection }) {
    // Esse método não deve ser chamado diretamente se usar a nova lógica do Service.
    // Mas se for, age como um update simples de decremento no banco.
    const usuario = await UsuarioModel.findByPk(id_usuario, { transaction: connection });
    if (!usuario) throw new NaoEncontrado("Usuário não encontrado.");
    
    await usuario.decrement("saldoAtual", { by: valor, transaction: connection });
    return { mensagem: "Saldo atualizado com sucesso." };
  }

  /**
   * Cria um usuário no banco de dados.
   */
  async createUser(user) {
    // user já vem formatado pelo toPersistence() da Entity
    try {
      const novoUsuario = await UsuarioModel.create(user);
      return { insertId: novoUsuario.idUsuario, result: novoUsuario.toJSON() };
    } catch (error) {
      throw error;
    }
  }

  async atualizarUsuario(idUsuario, dadosParaAtualizacao, transaction = null) {
    try {
      const [linhasAfetadas] = await UsuarioModel.update(dadosParaAtualizacao, {
        where: { idUsuario },
        transaction
      });
      return { affectedRows: linhasAfetadas };
    } catch (erro) {
      throw erro;
    }
  }

  /**
   * Verifica as credenciais do usuário e retorna os dados do usuário.
   */
  async getUserSaldo(userId) {
    try {
      const usuario = await UsuarioModel.findByPk(userId, {
        attributes: ["saldoAtual"],
      });
      // Retorna formato esperado pelo front { saldo_atual: ... }
      return usuario ? { saldo_atual: usuario.saldoAtual } : null;
    } catch (error) {
      console.error("Erro no UserRepository.getUserSaldo:", error.message);
      throw error;
    }
  }

  async atualizarUserSaldo(userId, novoSaldo) {
    try {
      const [linhasAfetadas] = await UsuarioModel.update(
        { saldoAtual: novoSaldo },
        { where: { idUsuario: userId } }
      );
      return { affectedRows: linhasAfetadas };
    } catch (error) {
      console.error(
        "Erro no UserRepository.atualizarUserSaldo:",
        error.message
      );
      throw error;
    }
  }

  async getUserById(userId, transaction = null, lock = false) {
    try {
      const options = { transaction };
      if (lock) options.lock = transaction.LOCK.UPDATE;

      const userData = await UsuarioModel.findByPk(userId, options);
      return userData ? userData.toJSON() : null;
    } catch (error) {
      console.error("Erro no UserRepository.getUserById:", error.message);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const userData = await UsuarioModel.findOne({
        where: { email },
      });
      return userData ? userData.toJSON() : null;
    } catch (error) {
      console.error("Erro no UserRepository.getUserByEmail:", error.message);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const result = await UsuarioModel.destroy({
        where: { idUsuario: userId },
      });
      
      if (result === 0) {
        throw new NaoEncontrado("Usuário não encontrado ou já deletado.");
      }
      return { affectedRows: result };
    } catch (error) {
      console.error("Erro no UserRepository.deleteUser:", error.message);
      throw error;
    }
  }
}

export default UserRepository;