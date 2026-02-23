import ErroBase from "./Errobase.js";
import RequisicaoIncorreta from "./RequisicaoIncorreta.js";

class ErroSqlHandler {
  static tratarErroSql(error) {
    if (!error || !error.code) {
      throw error;
    }

    const msg = this._getMensagemSql(error);

    // Regra de Validação de Domínio (Check Constraints)
    if (msg.includes("CONSTRAINT") && msg.includes("failed")) {
        throw this.erroCheckConstraint(error);
    }

    switch (error.code) {
      case "ER_DUP_ENTRY":
        throw this.erroDuplicado(error);
      case "ER_BAD_FIELD_ERROR":
        throw this.erroCampoInvalido(error);
      case "ER_BAD_NULL_ERROR":
        throw this.erroCampoNulo(error);
      case "ER_NO_DEFAULT_FOR_FIELD":
        throw this.erroCampoSemDefault(error);
      case "ER_NO_SUCH_TABLE":
        throw this.erroTabelaNaoEncontrada(error);
      case "WARN_DATA_TRUNCATED":
        throw this.erroDadoTruncado(error);
      case "ER_INNODB_AUTOEXTEND_SIZE_OUT_OF_RANGE": 
        throw this.erroTamanhoMaximoExcedido(error);
      default:
        console.error("🔥 [UNMAPPED SQL ERROR]:", error.code, msg);
        // Retorna erro genérico 500 de servidor, sem vazar a mensagem real do SQL
        throw new ErroBase("Erro interno ao processar os dados.", 500, "DATABASE_ERROR");
    }
  }

  // -----------------------------
  // MAPEAMENTOS
  // -----------------------------

  static erroCheckConstraint(error) {
    const msg = this._getMensagemSql(error);
    const match = msg.match(/CONSTRAINT `(.+?)` failed/i) || msg.match(/CONSTRAINT "(.+?)" failed/i);
    const nomeConstraint = match ? match[1] : "desconhecida";

    const mapaErros = {
        "chk_gastos_cartao_credito": "Para gastos no Crédito, é obrigatório vincular um Cartão.",
        "chk_valor_positivo": "O valor informado deve ser maior que zero.",
    };

    const mensagemAmigavel = mapaErros[nomeConstraint];
    if (mensagemAmigavel) {
        return new RequisicaoIncorreta(mensagemAmigavel);
    }

    // 🛡️ Segurança: Loga o nome real no console, mas diz pro cliente algo genérico
    console.error(`Constraint não mapeada: ${nomeConstraint}`);
    return new RequisicaoIncorreta("Regra de negócio violada. Verifique os dados enviados.");
  }

  static erroDuplicado(error) {
    const msg = this._getMensagemSql(error);
    const chave = this.extrairChaveDuplicada(msg);

    // 🛡️ DESIGN PATTERN: Dictionary em vez de if/else aninhados
    const mapaDuplicidade = {
      "uq_cartao_unico_usuario_ativo": "Este cartão já está cadastrado na sua conta.",
      "usuarios.email": "Este email já está em uso.",
      "uq_categoria_usuario": "Você já possui uma categoria com este nome."
    };

    // Tenta encontrar a mensagem pelo nome exato da chave no banco
    let mensagemAmigavel = mapaDuplicidade[chave];

    // Fallback: se o banco retornou a chave de forma diferente, busca por partes (includes)
    if (!mensagemAmigavel) {
      if (msg.includes("email")) mensagemAmigavel = mapaDuplicidade["usuarios.email"];
    }

    if (mensagemAmigavel) {
      return new RequisicaoIncorreta(mensagemAmigavel); // Status 400 (Bad Request)
    }

    console.error(`Duplicidade não mapeada para a chave: ${chave}`);
    // Status 409 (Conflict) fixado corretamente através do ErroBase
    return new ErroBase("Os dados enviados já existem no sistema.", 409, "CONFLICT");
  }

  static erroCampoNulo(error) {
    const msg = this._getMensagemSql(error);
    const campo =
      this.extrairCampoPorColumnCannotBeNull(msg) ||
      this.extrairCampoPorField(msg) ||
      this.extrairCampoPorColumn(msg);

    return new RequisicaoIncorreta(
      "Informações incompletas.",
      campo ? [`O campo '${campo}' não pode estar vazio.`] : ["Existem campos obrigatórios em branco."]
    );
  }

  static erroCampoSemDefault(error) {
    return new RequisicaoIncorreta("Faltam dados obrigatórios para concluir o cadastro.");
  }

  static erroTabelaNaoEncontrada(error) {
    return new ErroBase("Serviço temporariamente indisponível.", 500, "INTERNAL_ERROR");
  }

  static erroCampoInvalido(error) {
    return new RequisicaoIncorreta("A requisição contém dados que não são reconhecidos pelo sistema.");
  }

  static erroDadoTruncado(error) {
    return new RequisicaoIncorreta("Um dos valores informados é muito extenso.");
  }

  static erroTamanhoMaximoExcedido(error) {
    if (error.sqlMessage && error.sqlMessage.includes('cartao_credito')) {
      return new ErroBase('Limite de operações excedido para este cartão.', 422, "UNPROCESSABLE_ENTITY");
    }
    return new ErroBase("A operação excedeu o tamanho máximo permitido.", 500, "CAPACITY_EXCEEDED");
  }

  // -----------------------------
  // FUNÇÕES UTILITÁRIAS DE REGEX
  // -----------------------------

  static _getMensagemSql(error) {
    return String(error.sqlMessage || error.message || "");
  }

  static extrairCampoPorColumnCannotBeNull(message) {
    const match = message.match(/Column '(.+?)' cannot be null/i);
    return match ? match[1] : null;
  }

  static extrairCampoPorColumn(message) {
    const match = message.match(/Column '(.+?)'/i);
    return match ? match[1] : null;
  }

  static extrairCampoPorField(message) {
    const match = message.match(/Field '(.+?)'/i);
    return match ? match[1] : null;
  }

  static extrairChaveDuplicada(message) {
    const match = message.match(/for key '(.+?)'/i);
    return match ? match[1] : null;
  }
}

export default ErroSqlHandler;