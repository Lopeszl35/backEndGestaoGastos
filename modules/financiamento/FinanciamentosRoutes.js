import express from "express";
import { 
    validarCriacaoFinanciamento, 
    validarPagamentoParcela, 
    validarAmortizacao,
    validarSimulacao,
    validarListagem
} from "./FinanciamentosValidate.js";

export default function FinanciamentosRoutes(controller) {
  const router = express.Router();

  // 1. Criar novo Financiamento
  // POST /api/financiamentos/criar?id_usuario=1
  router.post(
    "/criar", 
    validarCriacaoFinanciamento, 
    (req, res, next) => controller.criar(req, res, next)
  );

  // 2. Listar Financiamentos Ativos
  // GET /api/financiamentos?id_usuario=1
  router.get(
    "/", 
    validarListagem, 
    (req, res, next) => controller.listarAtivos(req, res, next)
  );

  // 3. Pagar uma Parcela específica
  // POST /api/financiamentos/parcelas/:id_parcela/pagar?id_usuario=1
  router.post(
    "/parcelas/:id_parcela/pagar", 
    validarPagamentoParcela, 
    (req, res, next) => controller.pagarParcela(req, res, next)
  );

  // 4. Amortizar Saldo Devedor
  // POST /api/financiamentos/:id_financiamento/amortizar?id_usuario=1
  router.post(
    "/:id_financiamento/amortizar", 
    validarAmortizacao, 
    (req, res, next) => controller.amortizar(req, res, next)
  );

  // 5. Simular Financiamento (Sem persistir)
  // POST /api/financiamentos/simular
  router.post(
    "/simular", 
    validarSimulacao, 
    (req, res, next) => controller.simular(req, res, next)
  );

  return router;
}