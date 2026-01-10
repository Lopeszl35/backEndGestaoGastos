import { UsuarioEntity } from "./domain/UsuarioEntity.js";

export default class AuthResponseDTO {
  constructor(userRow, token) {
    // Usa a Entity para garantir a conversão correta para snake_case
    // userRow vem do Sequelize (camelCase)
    this.user = new UsuarioEntity(userRow).toPublicDTO();
    this.token = token;
  }
}