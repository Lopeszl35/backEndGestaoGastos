import RequisicaoIncorreta from "../../../errors/RequisicaoIncorreta.js";

export class GastosEntity {
  constructor({
    id_gasto,
    id_usuario,
    id_categoria,
    descricao,
    origem_lancamento,
    metadados_json,
    descricao_normalizada,
    forma_pagamento,
    id_cartao,
    valor,
    data_gasto,
    // Aceita também campos do DTO de entrada se diferirem
    uuidCartao, 
    idCategoria,
    dataGasto
  }) {
    this.id_gasto = id_gasto;
    this.id_usuario = id_usuario;
    this.id_categoria = id_categoria || idCategoria; // Suporta camelCase do DTO
    this.descricao = descricao;
    this.origem_lancamento = origem_lancamento || "manual";
    this.metadados_json = metadados_json;
    this.descricao_normalizada = descricao_normalizada;
    
    // Se não veio normalizada, normaliza agora
    if (!this.descricao_normalizada && this.descricao) {
        this.descricao_normalizada = this.descricao.trim().toLowerCase();
    }

    this.forma_pagamento = forma_pagamento || "DINHEIRO";
    
    // Lógica para cartão: pode vir id_cartao (banco) ou uuidCartao (front)
    // O Service resolverá UUID -> ID, aqui apenas armazenamos se já for ID
    this.id_cartao = id_cartao; 
    
    this.valor = Number(valor);
    this.data_gasto = data_gasto || dataGasto;

    // Validação básica de domínio
    if (this.valor <= 0) throw new RequisicaoIncorreta("O valor deve ser maior que zero.");
    if (!this.data_gasto) throw new RequisicaoIncorreta("Data do gasto é obrigatória.");
  }

  // Retorna objeto plano pronto para o Sequelize (usando os nomes de colunas definidos no Model)
  toPersistence() {
    return {
      id_usuario: this.id_usuario,
      id_categoria: this.id_categoria,
      descricao: this.descricao,
      origem_lancamento: this.origem_lancamento,
      metadados_json: this.metadados_json,
      descricao_normalizada: this.descricao_normalizada,
      forma_pagamento: this.forma_pagamento,
      id_cartao: this.id_cartao,
      valor: this.valor,
      data_gasto: this.data_gasto
    };
  }
}