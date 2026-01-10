import ValidationError from "../../../errors/ValidationError.js";

export class CategoriaEntity {
  constructor({
    id_categoria,
    idCategoria,
    id_usuario,
    idUsuario,
    nome,
    nome_normalizado,
    nomeNormalizado,
    limite,
    ativo,
    data_criacao,
    dataCriacao,
    inativado_em,
    inativadoEm
  }) {
    this.id_categoria = id_categoria || idCategoria;
    this.id_usuario = id_usuario || idUsuario;
    this.nome = this.#validarNome(nome);
    this.limite = limite ? Number(limite) : null;
    this.ativo = ativo !== undefined ? ativo : true;
    
    // Normalização automática para buscas (snake_case no banco)
    this.nome_normalizado = nomeNormalizado || nome_normalizado || this.nome.trim().toLowerCase();
    
    this.data_criacao = data_criacao || dataCriacao;
    this.inativado_em = inativado_em || inativadoEm;
  }

  #validarNome(nome) {
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      throw new ValidationError("O nome da categoria deve ter pelo menos 2 caracteres.");
    }
    return nome.trim();
  }

  // Prepara para salvar (CamelCase para o Sequelize Model)
  toPersistence() {
    return {
      idUsuario: this.id_usuario,
      nome: this.nome,
      nomeNormalizado: this.nome_normalizado,
      limite: this.limite,
      ativo: this.ativo,
      inativadoEm: this.inativado_em
    };
  }

  // Prepara para o Front (Snake Case)
  toPublicDTO() {
    return {
      id_categoria: this.id_categoria,
      id_usuario: this.id_usuario,
      nome: this.nome,
      limite: this.limite,
      ativo: this.ativo,
      data_criacao: this.data_criacao
    };
  }
}