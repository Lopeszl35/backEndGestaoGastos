import { body, query, validationResult } from 'express-validator';
import ErroValidacao from '../../errors/ValidationError.js';

function handleValidation(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new ErroValidacao(errorMessages));
  }
  return next();
}

export const validateGetLimiteGastoMes = [
    query('ano')
        .exists().withMessage('Ano obrigatório.')
        .isInt({ min: 2000 }).withMessage('Ano deve ser um número inteiro válido.')
        .notEmpty().withMessage('Ano não pode ser vazio.'),

    query('mes')
        .exists().withMessage('Mês obrigatório.')
        .isInt({ min: 1, max: 12 }).withMessage('Mês deve ser um número inteiro entre 1 e 12.')
        .notEmpty().withMessage('Mês não pode ser vazio.'),

    handleValidation
];

export const validateConfigGastoLimiteMes = [
    body('dadosMes')
        .exists({ checkFalsy: true }).withMessage("Informações fornecidas inválidas.")
        .isObject().withMessage("Dados do mês inválidos."),

    body('dadosMes.limiteGastoMes')
        .exists().withMessage("Informar limite de gasto do mês é obrigatório.")
        .isNumeric().withMessage("Valor inválido para limite de gasto do mês."),

    body('dadosMes.mes')
        .exists().withMessage("Mês atual inválido ou não informado.")
        .isInt({ min: 1, max: 12 }).withMessage("Mês inválido. Deve ser entre 1 e 12."),

    body('dadosMes.ano')
        .exists().withMessage("Ano atual inválido ou não informado.")
        .isInt({ min: 2000 }).withMessage("Ano inválido. Deve ser um número inteiro válido."),

    handleValidation
];

export const validateGetGastosTotaisPorCategoria = [
    query('inicio')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Data inicio deve estar no formato YYYY-MM-DD.'),

    query('fim')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Data fim deve estar no formato YYYY-MM-DD.'),

    // Validação customizada para garantir que se um for enviado, o outro também seja
    query('inicio').custom((inicio, { req }) => {
        const { fim } = req.query;
        if (!inicio && !fim) return true; // Ambos vazios = OK
        
        if ((inicio && !fim) || (!inicio && fim)) {
            throw new Error("Envie inicio e fim juntos, ou não envie nenhum.");
        }

        const inicioDate = new Date(`${inicio}T00:00:00.000Z`);
        const fimDate = new Date(`${fim}T23:59:59.999Z`);

        if (inicioDate > fimDate) {
            throw new Error("A data inicio não pode ser maior que a data fim.");
        }
        return true;
    }),

    handleValidation
];

export const validateAddGasto = [
  body("gastos")
    .exists({ checkFalsy: true }).withMessage("Um objeto de gastos é obrigatório.")
    .isObject().withMessage("'gastos' deve ser um objeto JSON válido."),

  body("gastos.valor")
    .exists().withMessage("Valor não informado.")
    .isFloat({ gt: 0 }).withMessage("Valor deve ser numérico e maior que zero."),

  body("gastos.data_gasto")
    .exists().withMessage("Data do gasto não informada.")
    .notEmpty().withMessage("Data do gasto não pode ser vazia.")
    .isISO8601().withMessage("Data do gasto em formato inválido."), // Aceita YYYY-MM-DD e ISO

  body("gastos.id_categoria")
    .optional()
    .isInt({ gt: 0 }).withMessage("Categoria inválida. Deve ser um inteiro positivo."),

  body("gastos.descricao")
    .optional()
    .isString().withMessage("Descrição deve ser texto.")
    .isLength({ max: 255 }).withMessage("Descrição excede 255 caracteres."),
    
  body("gastos.forma_pagamento")
    .optional()
    .isIn(['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO']).withMessage("Forma de pagamento inválida."),

  handleValidation,
];