import express from "express";
import verifyToken from "../../middleware/verifyToken.js";
import { obterVisaoGeralCartoesValidate, criarCartaoCreditoValidate, criarLancamentoCartaoValidate, ativarDesativarCartaoValidate, editarCartaoValidate  } from "./CartoesValidate.js";

const router = express.Router();

export default function CartoesRoutes(cartoesController) {

  // Endpoint 1 (principal): retorna TUDO que a tela precisa
  router.get(
    "/getCartoesVisaoGeral/:id_usuario",
    verifyToken,
    obterVisaoGeralCartoesValidate,
    (req, res, next) => cartoesController.obterVisaoGeral(req, res, next)
  );

  // Endpoint 2: criar cartão
  router.post(
    "/criarCartao/:id_usuario",
    verifyToken,
    criarCartaoCreditoValidate,
    (req, res, next) => cartoesController.criarCartao(req, res, next)
  );

  // rota para ensirir gastos
  router.post(
  "/cartoes/:id_usuario/:cartao_uuid/lancamentos",
  verifyToken,
  criarLancamentoCartaoValidate,
  (req, res, next) => cartoesController.criarLancamento(req, res, next)
);

// rota para ativar ou desativar cartão
router.put(
  "/cartoes/:id_usuario/:cartao_uuid/ativar", verifyToken, ativarDesativarCartaoValidate,
  (req, res, next) => cartoesController.ativarDesativarCartao(req, res, next)
);

// rota para editar cartão
router.put(
  "/editarCartoes/:id_usuario/:cartao_uuid", verifyToken, editarCartaoValidate,
  (req, res, next) => cartoesController.editarCartao(req, res, next)
);

// rota para pagamento de faturas
router.post(
  "/cartoes/:id_usuario/:id_cartao/pagarFatura", verifyToken,
  (req, res, next) => cartoesController.pagarFatura(req, res, next)
);

// rota para pegar todos os cartoes
router.get(
  "/cartoes/:id_usuario", verifyToken,
  (req, res, next) => cartoesController.obterTodosCartoes(req, res, next)
);

// rota para deletar cartao
router.delete(
  "/cartoes/:id_usuario/:cartao_uuid", verifyToken,
  (req, res, next) => cartoesController.deletarCartao(req, res, next)
);

  return router;
}
