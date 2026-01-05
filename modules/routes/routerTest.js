import express from 'express';
import cors from 'cors';

const router = express.Router();
router.use(cors());

router.get('/status', (req, res) => {
    res.status(200).send({
        message: "Servidor rodando",
        code: 200
    });
});

export default router;
