export default class AuthResponseDTO {
  // 🛡️ INJEÇÃO LIMPA: userData já vem mapeado (via toPublicDTO do Service)
  constructor(userData, accessToken, refreshToken) {
    this.user = userData;
    this.refreshToken = refreshToken;
    this.accessToken = accessToken;
    Object.freeze(this); // Imutabilidade total do DTO
  }
}