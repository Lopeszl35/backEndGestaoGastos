import ValidationError from "../../../errors/ValidationError.js";
import RequisicaoIncorreta from "../../../errors/RequisicaoIncorreta.js";
import { token } from "morgan";

export class UsuarioEntity {
  constructor({
    id_usuario,
    idUsuario,
    nome,
    email,
    senha_hash,
    senhaHash,
    perfil_financeiro,
    perfilFinanceiro,
    salario_mensal,
    saldo_inicial,
    saldo_atual,
    saldoAtual,
    data_cadastro,
  }) {
    this.id_usuario = id_usuario || idUsuario;
    this.nome = this.#validarNome(nome);
    this.email = this.#validarEmail(email);
    this.senha_hash = senha_hash || senhaHash; // O hash é gerado antes ou no setter, mas a entidade guarda o estado
    this.perfil_financeiro = perfil_financeiro || perfilFinanceiro || "moderado";
    
    // Normalização de valores numéricos
    this.salario_mensal = this.#normalizarValor(salario_mensal);
    this.saldo_inicial = this.#normalizarValor(saldo_inicial);
    
    // Prioridade para saldo_atual se existir, senão usa saldoAtual, senão saldo_inicial
    const saldo = saldo_atual !== undefined ? saldo_atual : (saldoAtual !== undefined ? saldoAtual : this.saldo_inicial);
    this.saldo_atual = this.#normalizarValor(saldo);

    this.data_cadastro = data_cadastro;
  }

  // --- Comportamentos de Domínio (Business Logic) ---

  /**
   * Debita um valor do saldo do usuário.
   * Lança erro se o saldo for insuficiente.
   */
  debitarSaldo(valor) {
    const valorNum = Number(valor);
    if (valorNum <= 0) throw new ValidationError("O valor do débito deve ser positivo.");

    // REGRA DE NEGÓCIO: Não permitir saldo negativo 
    if (this.saldo_atual < valorNum) {
      throw new RequisicaoIncorreta(
        `Saldo insuficiente. Saldo atual: R$${this.saldo_atual.toFixed(2)}, Tentativa: R$${valorNum.toFixed(2)}`
      );
    }

    this.saldo_atual -= valorNum;
  }

  aumentarSaldo(valor) {
    const valorNum = Number(valor);
    if (valorNum <= 0) throw new ValidationError("O valor do depósito deve ser positivo.");
    this.saldo_atual += valorNum;
  }

  // --- Validações Privadas ---

  #validarNome(nome) {
    if (!nome || nome.trim().length < 3) {
      throw new ValidationError("O nome deve ter pelo menos 3 caracteres.");
    }
    return nome.trim();
  }

  #validarEmail(email) {
    if (!email || !email.includes("@")) {
      throw new ValidationError("E-mail inválido.");
    }
    return email.trim().toLowerCase();
  }

  #normalizarValor(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0.0;
  }

  // Método para exportar dados para o Repository salvar
  toJSON() {
    return {
      id_usuario: this.id_usuario,
      nome: this.nome,
      email: this.email,
      senha_hash: this.senha_hash,
      perfil_financeiro: this.perfil_financeiro,
      salario_mensal: this.salario_mensal,
      saldo_inicial: this.saldo_inicial,
      saldo_atual: this.saldo_atual,
    };
  }

  toPersistence() {
    return {
      idUsuario: this.id_usuario,
      nome: this.nome,
      email: this.email,
      senhaHash: this.senha_hash,
      perfilFinanceiro: this.perfil_financeiro,
      salarioMensal: this.salario_mensal,
      saldoInicial: this.saldo_inicial,
      saldoAtual: this.saldo_atual,
    };
  }

  // Para o Frontend (Snake_Case) - "saldo_atual"
  toPublicDTO() {
    return {
      id_usuario: this.id_usuario,
      nome: this.nome,
      email: this.email,
      perfil_financeiro: this.perfil_financeiro,
      salario_mensal: this.salario_mensal,
      saldo_atual: this.saldo_atual,
      saldo_inicial: this.saldo_inicial,
      data_cadastro: this.data_cadastro,
      token: this.token
    };
  }
}