import rateLimit from "express-rate-limit";

// Limiter específico para rotas de autenticação (login)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Limite de 5 tentativas por IP a cada 15 minutos
    message: {
        status: 429,
        error: "Too many login attempts. Please try again after 15 minutes.",
        message: "Muitas tentativas de login. Sua conta/IP foi temporariamente bloqueada por 15 minutos."
    },
    standardHeaders: true, // Retorna os cabeçalhos de rate limit
    legacyHeaders: false, // Desativa os cabeçalhos legados
})