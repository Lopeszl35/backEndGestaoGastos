import express from 'express';

const router = express.Router();

router.get('/status', (req, res) => {
    res.status(200).send('Servidor ok');
});

export default router;