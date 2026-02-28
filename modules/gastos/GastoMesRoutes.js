import express from 'express';
import cors from 'cors';
import verifyToken from '../../middleware/verifyToken.js';
import { 
    validateGetLimiteGastoMes,
    validateConfigGastoLimiteMes,
    validateGetGastosTotaisPorCategoria,
    validateAddGasto
} from './GastoMesValidate.js';

const router = express.Router();


router.use(cors());

export default (gastoMesController) => {

    // rota para obter a meta de limite imposta no mês pelo usuário e gasto total do mês
    router.get('/getLimiteGastoMes', verifyToken, validateGetLimiteGastoMes , (req, res, next) => {
        gastoMesController.getGastoLimiteMes(req, res, next);
    });

    // rota para configurar a meta de limite de gastos do mês do usuário
    router.post('/configGastoLimiteMes/', verifyToken, validateConfigGastoLimiteMes, (req, res, next) => {
        gastoMesController.configGastoLimiteMes(req, res, next);
    });

    // Gerar relatorio que voltara dados de gastos de todo o perído de todas as categorias
    router.get('/relatorioGastos', verifyToken, validateGetGastosTotaisPorCategoria, (req, res, next) => {
        gastoMesController.getGastosTotaisPorCategoria(req, res, next);
    })

     router.post("/addGasto", verifyToken, validateAddGasto, (req, res, next) => {
     gastoMesController.addGasto(req, res, next);
  });

  router.patch("/updateGasto", verifyToken, (req, res, next) => {
    gastoMesController.recalcularGastoAtualMes(req, res, next);
  });

    return router;
}

