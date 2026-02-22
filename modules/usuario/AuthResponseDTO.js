import { UsuarioEntity } from "./domain/UsuarioEntity.js";

export default class AuthResponseDTO {
  constructor(userRow, token) {
    this.user = new UsuarioEntity(userRow).toPublicDTO();
    this.token = token;
  }
}