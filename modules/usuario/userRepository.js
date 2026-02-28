class UserRepository {
  constructor(database) {
    this.usuarioModel = database.UsuarioModel;
    this.refreshTokenModel = database.RefreshTokenModel;
  }

  // ==========================================
  // 🛡️ GESTÃO DE SESSÕES (REFRESH TOKENS)
  // ==========================================

  async salvarRefreshToken(idUsuario, token, expiresAt, transaction = null) {
      await this.refreshTokenModel.create(
        {
        token,
        id_usuario: idUsuario,
        revoked: false,
        expires_at: expiresAt
      },
      { transaction }
    );
  }

  async buscarRefreshToken(tokenString) {
      const tokenRecord = await this.refreshTokenModel.findOne(
        {
          where: { token: tokenString }
        }
      );
      return tokenRecord ? tokenRecord.toJSON() : null;
  }

  async revogarRefreshToken(tokenString) {
      const [ linhasAfetadas ] = await this.refreshTokenModel.update(
        { revoked: true },
        { where: { token: tokenString } }
      );
      return linhasAfetadas; // Retorna o número de tokens revogados (0 ou 1)
  }
  
  // ==========================================
  // 🛡️ MÉTODOS DE ESCRITA E ATUALIZAÇÃO
  // ==========================================

  async diminuirSaldoAtual({ id_usuario, valor, connection }) {
      // 🛡️ DEFENSIVE PROGRAMMING + PERFORMANCE: Operação Atômica (Execute-in-Place).
      // Instruímos o MySQL a subtrair o valor diretamente no disco.
      const [linhasAfetadas] = await this.usuarioModel.decrement("saldoAtual", { 
        by: valor, 
        where: { idUsuario: id_usuario },
        transaction: connection 
      });

      // O retorno de decrement pode variar entre drivers/dialetos, garantimos a captura segura:
      const affectedRows = Array.isArray(linhasAfetadas) 
        ? linhasAfetadas[0]?.affectedRows || linhasAfetadas 
        : linhasAfetadas;
      
      return { affectedRows: affectedRows || 0 };
  }

  async createUser(user, transaction) {
      // Cria o usuário
      const novoUsuario = await this.usuarioModel.create(user, { transaction });
      
      // Retorna formato compatível (DTO de Banco)
      return { 
        insertId: novoUsuario.idUsuario, 
        result: novoUsuario.toJSON() 
      };
  }

  async atualizarUsuario(idUsuario, dadosParaAtualizacao, transaction = null) {
      const [linhasAfetadas] = await this.usuarioModel.update(dadosParaAtualizacao, {
        where: { idUsuario },
        transaction
      });
      return { affectedRows: linhasAfetadas };
  }

  async atualizarUserSaldo(userId, novoSaldo) {
      const [linhasAfetadas] = await this.usuarioModel.update(
        { saldoAtual: novoSaldo },
        { where: { idUsuario: userId } }
      );
      return { affectedRows: linhasAfetadas };
  }

  // ==========================================
  // 🛡️ MÉTODOS DE LEITURA E DELEÇÃO
  // ==========================================

  async getUserById(userId, transaction = null, lock = false) {
      const options = { transaction };
      
      // 🛡️ BLINDAGEM (Null Safety): Garante que o Lock não estoure um erro fatal de V8 Engine.
      // Locks do MySQL exigem contexto transacional.
      if (lock) {
        if (!transaction) throw new Error("Operação de Lock exige uma transação ativa.");
        options.lock = transaction.LOCK.UPDATE;
      }

      const userData = await this.usuarioModel.findByPk(userId, options);
      return userData ? userData.toJSON() : null;
  }

  async getUserByEmail(email) {
      const userData = await this.usuarioModel.findOne({ where: { email } });
      return userData ? userData.toJSON() : null;
  }

  async getUserSaldo(userId) {
      const usuario = await this.usuarioModel.findByPk(userId, {
        attributes: ["saldoAtual"],
      });
      return usuario ? { saldo_atual: usuario.saldoAtual } : null;
  }

  async deleteUser(userId) {
    const transaction = await this.usuarioModel.sequelize.transaction();
    try {
      const usuario = await this.usuarioModel.findByPk(userId, { transaction });
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
      throw error;
    }
  }
}


export default UserRepository;