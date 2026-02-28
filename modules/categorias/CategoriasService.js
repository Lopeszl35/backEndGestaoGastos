import RequisicaoIncorreta from "../../errors/RequisicaoIncorreta.js";
import { normalizarNomeCategoria } from "./categoriasValidade.js";

export default class CategoriasService {
  constructor(CategoriasRepository) {
    this.CategoriasRepository = CategoriasRepository;
  }

  async createCategoria(categoria, id_usuario, connection) {
    try {
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
    } catch (error) {
      console.error("Erro ao criar categoria no Service:", error.message);
      throw error;
    }
  }

  async getCategoriasAtivas(id_usuario) {
    try {
      const result = await this.CategoriasRepository.getCategoriasAtivas(id_usuario);
      return result;
    } catch (error) {
      console.error("Erro ao buscar categorias no service:", error.message);
      throw error;
    }
  }

  async updateCategoria(id_categoria, id_usuario, categoria, connection) {
    try {
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
    } catch (error) {
      console.error("Erro ao atualizar categoria no service:", error.message);
      throw error;
    }
  }

  async deleteCategoria(id_categoria, id_usuario, dataAtual, connection) {
    try {
      const result = await this.CategoriasRepository.deleteCategoria(
        id_categoria,
        id_usuario,
        dataAtual,
        connection
      );
      return result;
    } catch (error) {
      console.error("Erro ao deletar categoria no service:", error.message);
      throw error;
    }
  }

  async getCategoriasInativas(id_usuario) {
    try {
      const result = await this.CategoriasRepository.getCategoriasInativas(id_usuario);
      return result;
    } catch (error) {
      console.error("Erro ao buscar categorias inativas no service:", error.message);
      throw error;
    }
  }

  async reativarCategoria(id_categoria, id_usuario, connection) {
    try {
      const result = await this.CategoriasRepository.reativarCategoria(
        id_categoria,
        id_usuario,
        connection
      );
      return result;
    } catch (error) {
      console.error("Erro ao reativar categoria no service:", error.message);
      throw error;
    }
  }
}