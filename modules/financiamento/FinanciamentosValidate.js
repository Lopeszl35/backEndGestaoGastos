import { body, param, query } from "express-validator";

function handleValidation(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new ErroValidacao(errors.array()));
  return next();
}


/**
 * Validações para Criação de Financiamento
 * Garante que valores financeiros e datas estejam corretos.
 */
export const validarCriacaoFinanciamento = [
  query("id_usuario")
    .notEmpty().withMessage("ID do usuário é obrigatório.")
    .isInt().withMessage("ID do usuário deve ser um número inteiro."),
  
  body("titulo")
    .trim()
    .notEmpty().withMessage("O título é obrigatório.")
    .isLength({ min: 3, max: 120 }).withMessage("O título deve ter entre 3 e 120 caracteres."),
  
  body("instituicao")
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage("Instituição deve ter no máximo 120 caracteres."),
  
  body("valorTotal")
    .notEmpty().withMessage("Valor total é obrigatório.")
    .isFloat({ gt: 0 }).withMessage("Valor total deve ser maior que zero."),
  
  body("numeroParcelas")
    .notEmpty().withMessage("Número de parcelas é obrigatório.")
    .isInt({ min: 1, max: 420 }).withMessage("Número de parcelas deve ser entre 1 e 420 (35 anos)."),
  
  body("taxaJurosMensal")
    .notEmpty().withMessage("Taxa de juros é obrigatória (envie 0 se for sem juros).")
    .isFloat({ min: 0 }).withMessage("Taxa de juros não pode ser negativa."),
  
  body("diaVencimento")
    .notEmpty().withMessage("Dia de vencimento é obrigatório.")
    .isInt({ min: 1, max: 31 }).withMessage("Dia de vencimento deve ser entre 1 e 31."),
  
  body("dataInicio")
    .notEmpty().withMessage("Data de início é obrigatória.")
    .isISO8601().withMessage("Data de início deve estar no formato YYYY-MM-DD."),

  handleValidation
];

/**
 * Validação para Pagamento de Parcela
 * NOTA: Não validamos id_categoria pois foi removido da regra de negócio.
 */
export const validarPagamentoParcela = [
  query("id_usuario")
    .notEmpty().withMessage("ID do usuário é obrigatório.")
    .isInt().withMessage("ID do usuário inválido."),
  
  param("id_parcela")
    .notEmpty().withMessage("ID da parcela é obrigatório.")
    .isInt().withMessage("ID da parcela deve ser um número inteiro."),

  handleValidation
];

/**
 * Validação para Amortização de Saldo
 */
export const validarAmortizacao = [
  query("id_usuario")
    .notEmpty().withMessage("ID do usuário é obrigatório.")
    .isInt().withMessage("ID do usuário inválido."),
  
  param("id_financiamento")
    .notEmpty().withMessage("ID do financiamento é obrigatório.")
    .isInt().withMessage("ID do financiamento inválido."),
  
  body("valorAmortizacao")
    .notEmpty().withMessage("Valor da amortização é obrigatório.")
    .isFloat({ gt: 0 }).withMessage("Valor da amortização deve ser maior que zero."),

  handleValidation
];

/**
 * Validação para Simulação (Apenas body)
 */
export const validarSimulacao = [
  body("valorTotal").isFloat({ gt: 0 }).withMessage("Valor total inválido."),
  body("taxaJurosMensal").isFloat({ min: 0 }).withMessage("Taxa de juros inválida."),
  body("numeroParcelas").isInt({ min: 1 }).withMessage("Número de parcelas inválido."),

  handleValidation
];

/**
 * Validação para Listagem
 */
export const validarListagem = [
  query("id_usuario")
    .notEmpty().withMessage("ID do usuário é obrigatório.")
    .isInt().withMessage("ID do usuário inválido."),

  handleValidation
];