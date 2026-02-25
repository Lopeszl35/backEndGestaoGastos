import jwt from 'jsonwebtoken';
const secret = process.env.JWT_SECRET;

// 🛡️ FAIL-FAST: Quebra a compilação do módulo se a infraestrutura estiver incorreta.
// O servidor vai "crashar" no momento em que você der 'npm start', avisando do erro.
if (!secret) {
    throw new Error("FATAL: JWT_SECRET não está definido nas variáveis de ambiente.");
}

const verifyToken = (req, res, next) => {
    // Busca o header ignorando case-sensitivity (Authorization ou authorization)
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        // HTTP 401 (Unauthorized) é o padrão correto para ausência de credenciais, não 403.
        return res.status(401).json({ 
            code: "UNAUTHORIZED",
            error: "Acesso negado. Nenhum token fornecido." 
        });
    }

    // 🛡️ Extração segura do Bearer token (cobre cenários com múltiplos espaços)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ 
            code: "MALFORMED_TOKEN",
            error: "Formato de token inválido. O formato esperado é 'Bearer <token>'." 
        });
    }

    const token = parts[1];

    try {
        // Validação criptográfica
        const decoded = jwt.verify(token, secret);
        
        // 🛡️ INJEÇÃO LIMPA NO CONTEXTO:
        req.user = {
            id: decoded.id,
            email: decoded.email
        };
        
        // Mantido para retrocompatibilidade com seus Controllers
        req.userId = decoded.id;
        
        next(); 
        
    } catch (error) {
        // Logamos o erro real e a stack trace apenas no servidor (via Logger estruturado futuramente)
        console.error(`[AUTH FAILURE] IP: ${req.ip} | Razão: ${error.message}`);
        
        // Se for um erro de expiração, podemos mandar um código específico para o Front-end
        // forçar um logout automático ou chamar o Refresh Token.
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                code: "TOKEN_EXPIRED",
                error: "Sua sessão expirou. Por favor, faça login novamente." 
            });
        }

        // Resposta genérica para assinaturas inválidas (protege contra hackers tentando forjar tokens)
        return res.status(401).json({ 
            code: "INVALID_TOKEN",
            error: "Falha na autenticação do token." 
        });
    }
};

export default verifyToken;