import ErroBase from "../errors/Errobase.js";
import RequisicaoIncorreta from "../errors/RequisicaoIncorreta.js";
import ErroSqlHandler from "../errors/ErroSqlHandler.js";

// eslint-disable-next-line no-unused-vars
export default function manipuladorDeErros(err, req, res, next) {
    if (err instanceof ErroBase) {
        console.log('Erro tratado:', err);
        return res.status(err.statusCode).json({
            message: err.message,
            code: err.code,
            details: err.erros,
        });
    } 

   // 2) Erros do Sequelize: validação de modelo (NOT NULL, validations etc.)
  // Ex: SequelizeValidationError (como o nomeNorm/bandeiraNorm/ultimos4Norm)
  if (err?.name === "SequelizeValidationError") {
    const details = Array.isArray(err.errors)
      ? err.errors.map((e) => {
          const campo = e?.path || "campo";
          const msg = e?.message || "valor inválido";
          return `${campo}: ${msg}`;
        })
      : ["Dados inválidos."];

    const erro = new RequisicaoIncorreta("Dados inválidos.", details);

    return res.status(erro.statusCode).json({
      message: erro.message,
      code: erro.code,
      details: erro.erros,
    });
  }

  // 3) Erros do Sequelize: violação de UNIQUE (índices únicos)
  // Geralmente é SequelizeUniqueConstraintError com parent.code=ER_DUP_ENTRY
  if (err?.name === "SequelizeUniqueConstraintError") {
    try {
      const sqlErr = err.parent || err.original || err;
      ErroSqlHandler.tratarErroSql(sqlErr); // deve lançar ErroBase/RequisicaoIncorreta
    } catch (translated) {
      if (translated instanceof ErroBase) {
        return res.status(translated.statusCode).json({
          message: translated.message,
          code: translated.code,
          details: translated.erros,
        });
      }

      // fallback seguro
      return res.status(409).json({
        message: "Registro duplicado.",
        code: "CONFLICT",
        details: ["Violação de unicidade (UNIQUE)."],
      });
    }
  }

  // 4) Erros SQL puros (mysql/mariadb) OU erros SQL encapsulados pelo Sequelize
  // Aqui entra: ER_BAD_FIELD_ERROR, ER_DUP_ENTRY, ER_NO_DEFAULT_FOR_FIELD, etc.
  const hasSqlCode = Boolean(err?.code || err?.parent?.code || err?.original?.code);

  if (hasSqlCode) {
    try {
      const sqlErr = err?.parent || err?.original || err;
      ErroSqlHandler.tratarErroSql(sqlErr); // deve lançar ErroBase
    } catch (translated) {
      if (translated instanceof ErroBase) {
        return res.status(translated.statusCode).json({
          message: translated.message,
          code: translated.code,
          details: translated.erros,
        });
      }
      // se não conseguiu traduzir, cai no genérico 500
    }
  }
  
    // Erro desconhecido (programming error / bug / lib)
    console.error('🔥 [CRITICAL BUG] Erro não tratado:', err);

    const response = {
        message: "Ocorreu um erro inesperado. Estamos trabalhando para resolver o problema.",
        code: "INTERNAL_SERVER_ERROR",
    };

    if (process.env.NODE_ENV === "development") {
      response.developer_details = {
        errorMessage: err.message,
        stack: err.stack,
        name: err.name,
      };
    }

    return res.status(500).json(response);
}
