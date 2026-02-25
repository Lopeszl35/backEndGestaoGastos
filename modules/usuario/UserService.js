import NaoEncontrado from "../../errors/naoEncontrado.js";
import ErroValidacao from "../../errors/ValidationError.js";
import ErroBase from "../../errors/Errobase.js";
import { generateToken } from "../../auth/token.js";
import Auth from "../../auth/auth.js";
import AuthResponseDTO from "./AuthResponseDTO.js";
import { hashPassword } from "../../auth/passwordHash.js";
import { UsuarioEntity } from "./domain/UsuarioEntity.js";
import { sequelize } from "../../database/sequelize.js";

class UserService {
  constructor(UserRepository) {
    this.UserRepository = UserRepository;
  }

  async createUser(userDataInput) {
    // Cria variavel de transação para controle de atomicidade
    let transaction;
    try {
      // Inicia uma transação
      transaction = await sequelize.transaction();

      // Hash da senha antes de salvar
      const senhaHash = await hashPassword(userDataInput.senha_hash);
    
      // Chama a Entity para criar o usuário
      const novoUsuario = new UsuarioEntity({...userDataInput,senha_hash: senhaHash})
    
      //Persiste no Banco (Passando a transaction)
      const resultModel = await this.UserRepository.createUser(
        novoUsuario.toPersistence(), 
        transaction
      );
      
      // Atualiza o ID gerado pela base na entidade (se necessário para o token)
      novoUsuario.id_usuario = resultModel.insertId;
      
      // Gera o token com os dados corretos
      const { accessToken, refreshToken } = generateToken(novoUsuario.toPublicDTO());

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // token válido por 7 dias

      // Salva o refresh token no banco
      await this.UserRepository.salvarRefreshToken(
        novoUsuario.id_usuario, 
        refreshToken, 
        expiresAt, 
        transaction // Passa a transação para garantir atomicidade
      );
      
      // Commita a transação
      await transaction.commit();

      return new AuthResponseDTO(novoUsuario.toPublicDTO(), accessToken, refreshToken);
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  }

  async deleteUser(userId) {
      const result = await this.UserRepository.deleteUser(userId);
      const affectedRows = Array.isArray(result) ? result[0] : result.affectedRows;

    if (!affectedRows || affectedRows === 0) {
      throw new NaoEncontrado("Usuário não encontrado.");
    }
      return result;
  }

  async atualizarUsuario(userId, updatesDto) {
    const payload = {};
    if (updatesDto.nome !== undefined) payload.nome = updatesDto.nome;
    if (updatesDto.email !== undefined) payload.email = updatesDto.email;
    if (updatesDto.perfil_financeiro !== undefined) payload.perfilFinanceiro = updatesDto.perfil_financeiro;
    if (updatesDto.salario_mensal !== undefined) payload.salarioMensal = updatesDto.salario_mensal;
    if (updatesDto.senha !== undefined) payload.senhaHash = await hashPassword(updatesDto.senha);

    if (Object.keys(payload).length === 0) {
      return { affectedRows: 0, message: "Nenhum campo para atualizar." };
    }

    // 🛡️ Faz a operação atômica de escrita direto
    const result = await this.UserRepository.atualizarUsuario(userId, payload);
    const affectedRows = Array.isArray(result) ? result[0] : result.affectedRows;

    if (!affectedRows || affectedRows === 0) {
      throw new NaoEncontrado("Usuário não encontrado.");
    }

    return result;
  }

  async loginUser(email, senha) {
      // userModel vem do Sequelize (camelCase: idUsuario, senhaHash...)
      const userModel = await this.UserRepository.getUserByEmail(email);
      if (!userModel) throw new NaoEncontrado("Credenciais inválidas.");
      
      await Auth.senhaValida(senha, userModel.senhaHash);

      // 1. Converte Model -> Entity (para aplicar regras/formatação)
      const entity = new UsuarioEntity(userModel);
      // 2. Gera o objeto público (snake_case: id_usuario, saldo_atual...)
      const userPublicData = entity.toPublicDTO(); 

      // 3. Gera o par de tokens (accessToken JWT + refreshToken opaco)
      const { accessToken, refreshToken } = generateToken(userPublicData);

      // Calcula o tempo de expiração do token (ex: 1 hora)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // token válido por 7 dias

      // 🛡️ Salva o refresh token opaco no banco de dados
      await this.UserRepository.salvarRefreshToken(userModel.idUsuario, refreshToken, expiresAt);
      
      // 4. Retorna DTO com os dados em snake_case
      const authResponse = new AuthResponseDTO(userPublicData, accessToken, refreshToken);
      console.log("Usuário logado:", authResponse);
      return authResponse;
  }

  async refreshAccessToken(oldRefreshToken) {
    if (!oldRefreshToken) {
      throw new ErroBase("Refresh Token não fornecido.", 400, "BAD_REQUEST");
    }

    const tokenRecord = await this.UserRepository.buscarRefreshToken(oldRefreshToken);

    // Camadas de segurança: Verificação de existência e validade do token
    if (!tokenRecord) throw new ErroBase("Sessão inválida.", 401, "UNAUTHORIZED");
    if (tokenRecord.revoked) throw new ErroBase("Sessão revogada por motivos de segurança. Faça login novamente.", 401, "UNAUTHORIZED");
    if (new Date() > new Date(tokenRecord.expires_at)) {
      throw new ErroBase("Sessão expirada. Faça login novamente.", 401, "UNAUTHORIZED");
    }

    const userModel = await this.UserRepository.getUserById(tokenRecord.id_usuario);
    if (!userModel) throw new NaoEncontrado("Usuário associado ao token não encontrado.");

    const entity = new UsuarioEntity(userModel);
    const userPublicData = entity.toPublicDTO();

    // Gera um novo par de tokens
    await this.UserRepository.revogarRefreshToken(oldRefreshToken);

    const { accessToken, refreshToken: newRefreshToken } = generateToken(userPublicData);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // token válido por 7 dias

    await this.UserRepository.salvarRefreshToken(userModel.idUsuario, newRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(refreshToken) {
    if (!refreshToken) {
      return;
    }
    await this.UserRepository.revogarRefreshToken(refreshToken);
    return { message: "Logout realizado com sucesso." };
  }

  async getUserSaldo(userId) {
      const userExists = await this.getUser(userId); // Verifica se o usuário existe, lança erro se não existir
      if (!userExists) {
        throw new NaoEncontrado("Usuário não encontrado");
      }
      const saldo = await this.UserRepository.getUserSaldo(userId);
      console.log("Saldo atual do usuário:", saldo);
      return saldo;
  }

  async atualizarUserSaldo(userId, novoSaldo) {
      const novoSaldoAtualizado = await this.UserRepository.atualizarUserSaldo(
        userId,
        novoSaldo
      );
      return novoSaldoAtualizado;
  }

  async diminuirSaldoAtualAposPagarFaturaCartao({ id_usuario, valor, connection }) {
      // 1. Busca com LOCK
      const userModel = await this.UserRepository.getUserById(id_usuario, connection, true);
      if (!userModel) throw new NaoEncontrado("Usuário não encontrado.");

      // 2. Hidrata Entidade
      const entity = new UsuarioEntity(userModel);

      // 3. Regra de Negócio (Valida saldo < valor)
      entity.debitarSaldo(valor);

      // 4. Persiste alteração
      await this.UserRepository.atualizarUsuario(
        id_usuario, 
        { saldoAtual: entity.saldo_atual }, 
        connection
      );
      
      return { mensagem: "Saldo atualizado com sucesso." };
  }

  async getUser(userId) {
      const userData = await this.UserRepository.getUserById(userId);
      // Mapeamento reverso (Model -> DTO) se necessário
      return userData ? this._mapToDTO(userData) : null;
  }

  // Helper privado para manter compatibilidade de retorno snake_case
  _mapToDTO(modelData) {
      return {
          id_usuario: modelData.idUsuario,
          nome: modelData.nome,
          email: modelData.email,
          perfil_financeiro: modelData.perfilFinanceiro,
          salario_mensal: modelData.salarioMensal,
          saldo_atual: modelData.saldoAtual,
          saldo_inicial: modelData.saldoInicial,
          data_cadastro: modelData.dataCadastro
      };
  }
}

export default UserService;
