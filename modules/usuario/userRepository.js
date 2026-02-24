import { UsuarioModel, RefreshTokenModel } from "../../database/models/index.js";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";
import { sequelize } from "../../database/sequelize.js";

class UserRepository {

  // ==========================================
  // 🛡️ GESTÃO DE SESSÕES (REFRESH TOKENS)
  // ==========================================

  async salvarRefreshToken(idUsuario, token, expiresAt, transaction = null) {
    try {
      await RefreshTokenModel.create(
        {
        token,
        id_usuario: idUsuario,
        revoked: false,
        expires_at: expiresAt
      },
      { transaction }
    );
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async buscarRefreshToken(tokenString) {
    try {
      const tokenRecord = await RefreshTokenModel.findOne(
        {
          where: { token: tokenString }
        }
      );
      return tokenRecord ? tokenRecord.toJSON() : null;
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  async revogarRefreshToken(tokenString) {
    try {
      const [ linhasAfetadas ] = await RefreshTokenModel.update(
        { revoked: true },
        { where: { token: tokenString } }
      );
      return linhasAfetadas; // Retorna o número de tokens revogados (0 ou 1)
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }
  
  // ==========================================
  // 🛡️ MÉTODOS DE ESCRITA E ATUALIZAÇÃO
  // ==========================================

  async diminuirSaldoAtual({ id_usuario, valor, connection }) {
    try {
      // 🛡️ DEFENSIVE PROGRAMMING + PERFORMANCE: Operação Atômica (Execute-in-Place).
      // Instruímos o MySQL a subtrair o valor diretamente no disco.
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
      throw error;
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