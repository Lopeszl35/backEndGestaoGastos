import RequisicaoIncorreta from "../../errors/RequisicaoIncorreta.js";
import { normalizarNomeCategoria } from "./categoriasValidate.js";

export default class CategoriasService {
  constructor(CategoriasRepository) {
    this.CategoriasRepository = CategoriasRepository;
  }

  async createCategoria(categoria, id_usuario, connection) {
      const nomeNormalizado = normalizarNomeCategoria(categoria.nome);
      
      const categoriaExists = await this.CategoriasRepository.checkCategoriaExists(
        nomeNormalizado,
        id_usuario,
        connection
      );

      if (categoriaExists) {
        throw new RequisicaoIncorreta(
          `A categoria com nome '${categoria.nome}' já existe para este usuário.`
        );
      }
      
      // Passamos o nome normalizado e a transação (connection)
      const result = await this.CategoriasRepository.createCategoria(
        categoria,
        nomeNormalizado,
        id_usuario,
        connection
      );
      return result;
  }

  async getCategoriasAtivas(id_usuario, ano, mes) {
      const result = await this.CategoriasRepository.getCategoriasAtivas(id_usuario, ano, mes);
      return result;
  }

  async updateCategoria(id_categoria, id_usuario, categoria, connection) {
      // Opcional: Validar se existe antes ou se o nome novo já existe
      const result = await this.CategoriasRepository.updateCategoria(
        id_categoria,
        id_usuario,
        categoria,
        connection
      );

      if (result.affectedRows === 0) {
       throw new NaoEncontrado('Categoria não encontrada ou sem permissão para atualizar.');
      }

      return result;
  }

  async deleteCategoria(id_categoria, id_usuario, dataAtual, connection) {
      const result = await this.CategoriasRepository.deleteCategoria(
        id_categoria,
        id_usuario,
        dataAtual,
        connection
      );
      return result;
  }

  async getCategoriasInativas(id_usuario) {
      const result = await this.CategoriasRepository.getCategoriasInativas(id_usuario);
      return result;
  }

  async reativarCategoria(id_categoria, id_usuario, connection) {
      const result = await this.CategoriasRepository.reativarCategoria(
        id_categoria,
        id_usuario,
        connection
      );
      return result;
  }
}