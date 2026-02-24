import { UsuarioModel } from "../../database/models/index.js";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";
import { sequelize } from "../../database/sequelize.js";

class UserRepository {
  
  // ==========================================
  // 🛡️ MÉTODOS DE ESCRITA E ATUALIZAÇÃO
  // ==========================================

  async diminuirSaldoAtual({ id_usuario, valor, connection }) {
    try {
      // 🛡️ DEFENSIVE PROGRAMMING + PERFORMANCE: Operação Atômica (Execute-in-Place).
      // Instruímos o MySQL a subtrair o valor diretamente no disco.
      // Removemos a busca prévia (Read-before-Write) que causava overhead de memória e vulnerabilidade TOCTOU.
      const [linhasAfetadas] = await UsuarioModel.decrement("saldoAtual", { 
        by: valor, 
        where: { idUsuario: id_usuario },
        transaction: connection 
      });

      // O retorno de decrement pode variar entre drivers/dialetos, garantimos a captura segura:
      const affectedRows = Array.isArray(linhasAfetadas) 
        ? linhasAfetadas[0]?.affectedRows || linhasAfetadas 
        : linhasAfetadas;
      
      return { affectedRows: affectedRows || 0 };
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error; // Garante o Bubble Up do erro se o handler não forçar a parada
    }
  }

  async createUser(user, transaction) {
    try {
      const novoUsuario = await UsuarioModel.create(user, { transaction });
      
      // Retorna formato compatível (DTO de Banco)
      return { 
        insertId: novoUsuario.idUsuario, 
        result: novoUsuario.toJSON() 
      };
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
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
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
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
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // ==========================================
  // 🛡️ MÉTODOS DE LEITURA E DELEÇÃO
  // ==========================================

  async getUserById(userId, transaction = null, lock = false) {
    try {
      const options = { transaction };
      
      // 🛡️ BLINDAGEM (Null Safety): Garante que o Lock não estoure um erro fatal de V8 Engine.
      // Locks do MySQL exigem contexto transacional.
      if (lock) {
        if (!transaction) throw new Error("Operação de Lock exige uma transação ativa.");
        options.lock = transaction.LOCK.UPDATE;
      }

      const userData = await UsuarioModel.findByPk(userId, options);
      return userData ? userData.toJSON() : null;
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error; 
    }
  }

  async getUserByEmail(email) {
    try {
      const userData = await UsuarioModel.findOne({ where: { email } });
      return userData ? userData.toJSON() : null;
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async getUserSaldo(userId) {
    try {
      const usuario = await UsuarioModel.findByPk(userId, {
        attributes: ["saldoAtual"], // Otimização de rede: Traz apenas o campo necessário
      });
      return usuario ? { saldo_atual: usuario.saldoAtual } : null;
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async deleteUser(userId) {
    const transaction = await UsuarioModel.sequelize.transaction();
    try {
      const usuario = await UsuarioModel.findByPk(userId, { transaction });
      if (!usuario) {
        await transaction.rollback();
        return { affectedRows: 0 }; // O serviço avaliará e lançará o NaoEncontrado
      }

      // 🛡️ PRÁTICA DE SEGURANÇA: Mascaramento de Email antes do Soft Delete
      const maskedEmail = `${usuario.email}.deleted.${Date.now()}`;
      // Atualiza o email para evitar conflitos únicos e preservar a integridade referencial, mesmo em Soft Deletes.
      await usuario.update({ email: maskedEmail }, { transaction });

      
      await usuario.destroy({ transaction });
      await transaction.commit();
      
      return { affectedRows: 1 };
    } catch (error) {
      await transaction.rollback();
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }
}


export default UserRepository;