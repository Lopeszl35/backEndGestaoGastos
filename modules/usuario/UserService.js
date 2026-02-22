import NaoEncontrado from "../../errors/naoEncontrado.js";
import ErroValidacao from "../../errors/ValidationError.js";
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
    const transaction = await sequelize.transaction();
      // Hash da senha antes de salvar
      const senhaHash = await hashPassword(userDataInput.senha_hash);

      // Chama a Entity para criar o usuário
      const novoUsuario = new UsuarioEntity({
        ...userDataInput,
        senha_hash: senhaHash
      })

     // 3. Persiste no Banco (Passando a transaction)
      const resultModel = await this.UserRepository.createUser(
        novoUsuario.toPersistence(), 
        transaction
      );

      // 4 commit da transação
      await transaction.commit();
      novoUsuario.id_usuario = resultModel.insertId;

      // 5. Gera o token com os dados corretos
      const token = generateToken(novoUsuario.toPublicDTO());

      return { 
          insertId: resultModel.insertId, 
          ...novoUsuario.toPublicDTO(), 
          token
      };
  }

  async deleteUser(userId) {
      const result = await this.UserRepository.deleteUser(userId);
      return result;
  }

  async atualizarUsuario(userId, updatesDto) {
    const payload = {};

    if (updatesDto.nome !== undefined) payload.nome = updatesDto.nome;
    if (updatesDto.email !== undefined) payload.email = updatesDto.email;
    if (updatesDto.perfil_financeiro !== undefined)
      payload.perfilFinanceiro = updatesDto.perfil_financeiro;
    if (updatesDto.salario_mensal !== undefined)
      payload.salarioMensal = updatesDto.salario_mensal;

    if (updatesDto.senha !== undefined) {
      payload.senhaHash = await hashPassword(updatesDto.senha);
    }
    console.log("payload: ", payload);

    if (Object.keys(payload).length === 0) {
      return { affectedRows: 0, message: "Nenhum campo para atualizar." };
    }

    return this.UserRepository.atualizarUsuario(userId, payload);
  }

  async loginUser(email, senha) {
      // userModel vem do Sequelize (camelCase: idUsuario, senhaHash...)
      const userModel = await this.UserRepository.getUserByEmail(email);
      
      if (!userModel) {
        throw new NaoEncontrado("Usuário não encontrado");
      } 
      
      const senhaValida = await Auth.senhaValida(senha, userModel.senhaHash);

      if (!senhaValida) {
        throw new ErroValidacao("Senha incorreta");
      }

      // 1. Converte Model -> Entity (para aplicar regras/formatação)
      const entity = new UsuarioEntity(userModel);
      
      // 2. Gera o objeto público (snake_case: id_usuario, saldo_atual...)
      const userPublicData = entity.toPublicDTO(); 

      // 3. Gera o token com os dados corretos
      const token = generateToken(userPublicData);
      
      // 4. Retorna DTO com os dados em snake_case
      return new AuthResponseDTO(userPublicData, token);
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
    try {
      const novoSaldoAtualizado = await this.UserRepository.atualizarUserSaldo(
        userId,
        novoSaldo
      );
      return novoSaldoAtualizado;
    } catch (error) {
      console.log(
        "Erro ao atualizar o saldo do usuário no modelo:",
        error.message
      );
      throw error;
    }
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
