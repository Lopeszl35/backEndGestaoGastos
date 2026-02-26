import { body, param, validationResult } from "express-validator";
import ErroValidacao from "../../errors/ValidationError.js";

function handleValidation(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new ErroValidacao(errors.array()));
  return next();
}

export const validateCreateUser = [
  body("user").isObject().withMessage("O campo 'user' deve ser um objeto contendo os dados do usuário.").bail(), // Interrompe a validação se 'user' não for um objeto, evitando erros subsequentes
  body("user").custom((value) => {
    const allowedFields = ["nome", "email", "senha_hash", "perfil_financeiro", "salario_mensal", "saldo_inicial"];
    const extraFields = Object.keys(value).filter((key) => !allowedFields.includes(key));
    if (extraFields.length > 0) {
      throw new Error(`Campos inválidos: ${extraFields.join(", ")}`);
    }
    return true;
  }),

  body("user.nome")
    .trim()
    .exists({ checkFalsy: true })
    .withMessage("O nome de usuário é obrigatório.")
    .isString()
    .withMessage("O nome de usuário deve ser uma string.")
    .isLength({ min: 3 })
    .withMessage("O nome de usuário deve ter pelo menos 3 caracteres."),

  body("user.email")
    .trim()
    .exists({ checkFalsy: true })
    .withMessage("O email é obrigatório.")
    .isEmail()
    .normalizeEmail()
    .withMessage("O email deve ser um endereço de email válido."),

  body("user.senha_hash")
    .trim()
    .isStrongPassword()
    .withMessage(
      "A senha deve conter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial."
    ),

  body("user.perfil_financeiro")
    .optional()
    .isString()
    .isIn(["conservador", "moderado", "arrojado"])
    .withMessage("O perfil financeiro deve ser uma string válida: conservador, moderado ou arrojado."),

  body("user.salario_mensal")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("O salário mensal deve ser um número positivo."),

  body("user.saldo_inicial")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("O saldo inicial deve ser um número positivo."),

  handleValidation,
];

export const validateUpdateUser = [
  body("user").isObject().withMessage("O campo 'user' deve ser um objeto contendo os dados do usuário.").bail(), // Interrompe a validação se 'user' não for um objeto, evitando erros subsequentes
  body("user").custom((value) => {
    const allowedFields = ["nome", "email", "senha", "perfil_financeiro", "salario_mensal"];
    const extraFields = Object.keys(value).filter((key) => !allowedFields.includes(key));
    if (extraFields.length > 0) {
      throw new Error(`Campos inválidos: ${extraFields.join(", ")}`);
    }
    return true;
  }),
  body("user.nome")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("O nome deve ter pelo menos 3 caracteres."),
  body("user.email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("O email deve ser válido.")
    .normalizeEmail(),
  body("user.senha")
    .optional()
    .trim()
    .isStrongPassword()
    .withMessage("Senha fraca."),
  body("user.perfil_financeiro")
    .optional()
    .trim()
    .isString()
    .withMessage("O perfil financeiro deve ser uma string."),
  body("user.salario_mensal")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("O salário mensal deve ser positivo."),

  handleValidation,
];

export const validateLoginUser = [
  body("email")
    .trim()
    .exists({ checkFalsy: true })
    .withMessage("Email não fornecido")
    .isEmail()
    .withMessage("O email deve ser um endereço de email válido."),

  body("senha")
    .trim()
    .exists({ checkFalsy: true })
    .withMessage("Senha não fornecida"),

  handleValidation,
];

