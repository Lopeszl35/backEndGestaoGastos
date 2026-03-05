import { QueryTypes } from "sequelize";

export default class AlertasRepository {
  constructor(dbContext) {
    this.sequelize = dbContext.sequelize;
    this.CategoriasModel = dbContext.CategoriasModel;
    this.AlertaModel = dbContext.AlertaModel;
  }

  async buscarCategoriaPorId({ id_usuario, id_categoria, connection }) {
    const categoria = await this.CategoriasModel.findOne({
      where: {
        idUsuario: id_usuario,
        idCategoria: id_categoria
      },
      attributes: ['idCategoria', 'nome', 'limite', 'ativo'],
      transaction: connection,
      raw: true // Retorna os dados puros (JSON) ao invés da instância do Sequelize
    });

    return categoria;
  }

  async buscarTotalGastoCategoriaNoMes({ id_usuario, id_categoria, data_gasto, connection }) {
    const sql = `
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM gastos
      WHERE id_usuario = :id_usuario
        AND id_categoria = :id_categoria
        AND YEAR(data_gasto) = YEAR(:data_gasto)
        AND MONTH(data_gasto) = MONTH(:data_gasto);
    `;

    // 🛡️ DYNAMIC TRANSACTIONS: O Sequelize aceita 'transaction: connection' internamente.
    // Se a connection for undefined/null, ele roda livre no pool automaticamente.
    const result = await this.sequelize.query(sql, {
      replacements: { 
        id_usuario: Number(id_usuario), 
        id_categoria: Number(id_categoria), 
        data_gasto 
      },
      type: QueryTypes.SELECT,
      transaction: connection
    });

    return Number(result[0]?.total ?? 0);
  }

  async existeAlertaCategoriaNoMes({
    id_usuario,
    id_categoria,
    ano,
    mes,
    tipo_alerta,
    connection,
  }) {
    // Mantida a query bruta devido ao uso extenso de funções de extração JSON do MySQL.
    const sql = `
      SELECT id_alerta
      FROM alertas_financeiros
      WHERE id_usuario = :id_usuario
        AND tipo_alerta = :tipo_alerta
        AND JSON_UNQUOTE(JSON_EXTRACT(dados_json, '$.id_categoria')) = :id_categoria
        AND JSON_UNQUOTE(JSON_EXTRACT(dados_json, '$.ano')) = :ano
        AND JSON_UNQUOTE(JSON_EXTRACT(dados_json, '$.mes')) = :mes
      LIMIT 1;
    `;

    const result = await this.sequelize.query(sql, {
      replacements: {
        id_usuario: Number(id_usuario),
        tipo_alerta: String(tipo_alerta),
        id_categoria: String(Number(id_categoria)),
        ano: String(Number(ano)),
        mes: String(Number(mes))
      },
      type: QueryTypes.SELECT,
      transaction: connection
    });

    // Retorna true se encontrou pelo menos um resultado
    return !!result?.length;
  }

  async criarAlerta({ id_usuario, severidade, tipo_alerta, mensagem, dados_json, connection }) {
    const novoAlerta = await this.AlertaModel.create({
      idUsuario: id_usuario,
      severidade: severidade,
      tipoAlerta: tipo_alerta,
      mensagem: mensagem,
      dadosJson: dados_json
    }, { transaction: connection });

    return { id_alerta: novoAlerta.idAlerta };
  }
}