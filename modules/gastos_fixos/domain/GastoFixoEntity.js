import RequisicaoIncorreta from "../../../errors/RequisicaoIncorreta.js";

export class GastoFixoEntity {
  constructor({
    idGastoFixo,
    id_gasto_fixo,
    idUsuario,
    id_usuario,
    tipo,
    titulo,
    descricao,
    valor,
    diaVencimento,
    dia_vencimento,
    recorrencia,
    ativo,
    criadoEm,
    atualizadoEm
  }) {
    this.idGastoFixo = idGastoFixo || id_gasto_fixo;
    this.idUsuario = idUsuario || id_usuario;
    
    this.tipo = tipo || "outros";
    this.titulo = this.#normalizarTexto(titulo);
    this.descricao = this.#normalizarTexto(descricao);
    this.valor = Number(valor);
    this.diaVencimento = Number(diaVencimento || dia_vencimento);
    this.recorrencia = recorrencia || "mensal";
    
    // Tratamento booleano seguro (aceita 1, "1", true, etc)
    this.ativo = (ativo === undefined || ativo === null) ? 1 : (Number(ativo) === 1 || String(ativo) === "true" ? 1 : 0);

    this.validar();
  }

  #normalizarTexto(texto) {
    if (!texto) return null;
    return String(texto).trim();
  }

  validar() {
    if (!this.idUsuario) throw new RequisicaoIncorreta("ID do usuário é obrigatório.");
    if (!this.titulo) throw new RequisicaoIncorreta("O título do gasto fixo é obrigatório.");
    if (this.valor <= 0) throw new RequisicaoIncorreta("O valor deve ser maior que zero.");
    
    if (!Number.isInteger(this.diaVencimento) || this.diaVencimento < 1 || this.diaVencimento > 31) {
      throw new RequisicaoIncorreta("Dia de vencimento inválido (1-31).");
    }

    const tiposValidos = ["luz", "agua", "internet", "assinatura", "telefone", "streaming", "academia", "outros"];
    if (!tiposValidos.includes(this.tipo)) {
        throw new RequisicaoIncorreta("Tipo de gasto fixo inválido.");
    }
  }

  // Prepara objeto para salvar no banco (Mapeado para o Model do Sequelize ou chaves compatíveis)
  toPersistence() {
    return {
      idUsuario: this.idUsuario,
      tipo: this.tipo,
      titulo: this.titulo,
      descricao: this.descricao,
      valor: this.valor,
      diaVencimento: this.diaVencimento,
      recorrencia: this.recorrencia,
      ativo: this.ativo
    };
  }
}