export default class AuthResponseDTO {
  // 🛡️ INJEÇÃO LIMPA: userData já vem mapeado (via toPublicDTO do Service)
  constructor(userData, token) {
    this.user = userData;
    this.token = token;
    Object.freeze(this); // Imutabilidade total do DTO
  }
}