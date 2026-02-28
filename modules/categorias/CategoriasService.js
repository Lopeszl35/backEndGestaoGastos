import RequisicaoIncorreta from "../../errors/RequisicaoIncorreta.js";
import NaoEncontrado from "../../errors/naoEncontrado.js"; // 🛡️ Corrigido o erro de importação ausente
import { CategoriaEntity } from "./domain/CategoriaEntity.js"; // 🛡️ Importando o Core do Domínio

export default class CategoriasService {
  constructor(CategoriasRepository) {
    this.CategoriasRepository = CategoriasRepository;
  }

  async createCategoria(categoria, id_usuario, connection) {
      // 🛡️ RICH DOMAIN: A Entidade é o "Segurança da Boate". 
      // Ao instanciar, ela automaticamente roda o #validarNome e gera o nome_normalizado.
      const categoriaEntity = new CategoriaEntity({
        ...categoria,
        id_usuario
      });
      
      // Usamos a propriedade garantida pela Entidade
      const categoriaExists = await this.CategoriasRepository.checkCategoriaExists(
        categoriaEntity.nome_normalizado,
        categoriaEntity.id_usuario,
        connection
      );

      if (categoriaExists) {
        throw new RequisicaoIncorreta(
          `A categoria com nome '${categoriaEntity.nome}' já existe para este usuário.`
        );
      }
      
      // Entregamos a entidade hidratada e blindada para o repositório
      const result = await this.CategoriasRepository.createCategoria(
        categoriaEntity, // O repositório vai ler .nome e .limite daqui
        categoriaEntity.nome_normalizado,
        categoriaEntity.id_usuario,
        connection
      );
      
      return result;
  }

  async getCategoriasAtivas(id_usuario, ano, mes) {
      const result = await this.CategoriasRepository.getCategoriasAtivas(id_usuario, ano, mes);
      return result;
  }

  async updateCategoria(id_categoria, id_usuario, categoria, connection) {
      // 🛡️ RICH DOMAIN: Passamos pela Entidade para garantir que não tentem 
      // atualizar um nome com menos de 2 caracteres, por exemplo.
      const categoriaEntity = new CategoriaEntity({
        ...categoria,
        id_categoria,
        id_usuario
      });

      const result = await this.CategoriasRepository.updateCategoria(
        categoriaEntity.id_categoria,
        categoriaEntity.id_usuario,
        categoriaEntity, 
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