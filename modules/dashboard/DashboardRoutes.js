import express from "express";
import verifyToken from "../../middleware/verifyToken.js";

const router = express.Router();

/**
 * Padrão de Injeção de Dependência nas Rotas
 * @param {object} dashboardController - Instância do controller injetada
 */
export default function DashboardRoutes(dashboardController) {

    // Endpoint: GET /api/dashboard/getSummary
    router.get("/getSummary", verifyToken, (req, res, next) => dashboardController.getSummary(req, res, next)
    );

    return router;
}