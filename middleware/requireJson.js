export default function requireJson(req, res, next) {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        if (!req.is('application/json')) {
            return res.status(400).json({
                code: "UNSUPPORTED_MEDIA_TYPE",
                message: "Content-Type deve ser application/json para este endpoint."
            })
        }
    }
    next();
}