import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET; // ✅ Usando JWT_SECRET

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];

    // Verifica se o token existe
    if (!token) {
        return res.status(403).json({ error: 'Nenhum token fornecido' });
    }

    // Remove o prefixo 'Bearer ' se ele existir
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    // Verifica se a secret está carregada
    if (!secret) {
        console.error('❌ JWT_SECRET não encontrado no .env');
        return res.status(500).json({ error: 'Configuração de segurança inválida' });
    }

    try {
        // ✅ CORREÇÃO: Usar jwt.verify de forma síncrona (sem callback)
        const decoded = jwt.verify(token, secret);
        
        // ✅ Define req.user com os dados decodificados
        req.user = {
            id: decoded.id,
            email: decoded.email
        };
        
        // ✅ Mantém userId para retrocompatibilidade
        req.userId = decoded.id;

        console.log('✅ Token verificado com sucesso:', req.user); // Log para debug
        
        next(); // ✅ Continua para o próximo middleware/controller
        
    } catch (error) {
        console.error('❌ Erro ao verificar token:', error.message);
        return res.status(401).json({ 
            error: 'Falha na autenticação do token',
            message: error.message 
        });
    }
};

export default verifyToken;