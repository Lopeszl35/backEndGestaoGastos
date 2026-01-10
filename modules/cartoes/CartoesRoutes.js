import express from "express";
import { obterVisaoGeralCartoesValidate, criarCartaoCreditoValidate, criarLancamentoCartaoValidate, ativarDesativarCartaoValidate, editarCartaoValidate  } from "./CartoesValidate.js";

const router = express.Router();

export default function CartoesRoutes(cartoesController) {

  // Endpoint 1 (principal): retorna TUDO que a tela precisa
  router.get(
    "/getCartoesVisaoGeral/:id_usuario",
    obterVisaoGeralCartoesValidate,
    (req, res, next) => cartoesController.obterVisaoGeral(req, res, next)
  );

  // Endpoint 2: criar cartão
  router.post(
    "/criarCartao/:id_usuario",
    criarCartaoCreditoValidate,
    (req, res, next) => cartoesController.criarCartao(req, res, next)
  );

  // rota para ensirir gastos
  router.post(
  "/cartoes/:id_usuario/:cartao_uuid/lancamentos",
  criarLancamentoCartaoValidate,
  (req, res, next) => cartoesController.criarLancamento(req, res, next)
);

// rota para ativar ou desativar cartão
router.patch(
  "/cartoes/:id_usuario/:cartao_uuid/ativar", ativarDesativarCartaoValidate,
  (req, res, next) => cartoesController.ativarDesativarCartao(req, res, next)
);

// rota para editar cartão
router.put(
  "/editarCartoes/:id_usuario/:cartao_uuid", editarCartaoValidate,
  (req, res, next) => cartoesController.editarCartao(req, res, next)
);

// rota para pagamento de faturas
router.post(
  "/cartoes/:id_usuario/:id_cartao/pagarFatura", 
  (req, res, next) => cartoesController.pagarFatura(req, res, next)
);

  return router;
}
