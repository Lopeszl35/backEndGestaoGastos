import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * @param {Object} user Entidade pública do usuário
 * @returns {Object} { accessToken, refreshToken }
 */
export function generateToken(user) {
    // 🛡️ 1. ACCESS TOKEN (Stateless - JWT)
    // Janela de ataque reduzida para 15 minutos. Protege a CPU do servidor,
    // pois o verifyToken.js validará isso sem tocar no banco de dados.
    const accessToken = jwt.sign(
        { id: user.id_usuario, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" } 
    );

    // 🛡️ 2. REFRESH TOKEN (Stateful - Opaque String)
    // Uma string de 64 caracteres hexadecimais de altíssima entropia.
    // Algoritmo: O(1) tempo de execução. Não contém dados do usuário (Opaco).
    const refreshToken = crypto.randomBytes(32).toString('hex');

    return { 
        accessToken, 
        refreshToken 
    };
}