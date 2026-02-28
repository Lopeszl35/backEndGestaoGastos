import ValidationError from "../../../errors/ValidationError.js";
import { normalizarNomeCategoria } from "../categoriasValidate.js";

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
    
    // a Entidade usa a exata mesma matemática de 
    // normalização (remoção de acentos/NFD) que o resto do sistema. Assim garantimos que o nome normalizado seja sempre consistente, independente de onde venha a categoria (criação, atualização, banco, etc).
    this.nome_normalizado = nomeNormalizado || nome_normalizado || normalizarNomeCategoria(this.nome);
    
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