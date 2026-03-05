import { Op, QueryTypes } from "sequelize";

export default class GastoMesRepository {
  constructor(dbContext) {
    this.sequelize = dbContext.sequelize;
    this.GastosModel = dbContext.GastosModel;
    this.TotalGastosMesModel = dbContext.TotalGastosMesModel;
    this.CategoriasModel = dbContext.CategoriasModel;
    this.UsuarioModel = dbContext.UsuarioModel;
  }

  // 1. Configurar Limite (Upsert)
  async configGastoLimiteMes(id_usuario, dadosMes, connection) {
      const { ano, mes, limiteGastoMes } = dadosMes;

      // Usando UPSERT do Sequelize
      await this.TotalGastosMesModel.upsert({
        id_usuario: id_usuario,
        ano: Number(ano),
        mes: Number(mes),
        limiteGastoMes: Number(limiteGastoMes),
      }, { transaction: connection });

      return {
        mensagem: "Configuração mensal salva com sucesso.",
        id_usuario: Number(id_usuario),
        ano: Number(ano),
        mes: Number(mes),
        limite_gasto_mes: Number(limiteGastoMes)
      };
  }

  // 2. Obter Limite
  async getLimiteGastosMes(id_usuario, ano, mes) {
      const resultado = await this.TotalGastosMesModel.findOne({
        where: { id_usuario: id_usuario, ano, mes },
        raw: true
      });
      // Retorna array para manter compatibilidade com código antigo que espera rows[0]
      return resultado || null;
  }

  async atualizarLimite(id_usuario, limite_gasto_mes, connection) {
      const [affectedRows] = await this.TotalGastosMesModel.update(
        { limiteGastoMes: limite_gasto_mes },
        { 
          where: { id_usuario: id_usuario },
          transaction: connection
        }
      );
      return { mensagem: "Limite atualizado com sucesso.", result: { affectedRows } };
  }

  // 4. Recalcular Gasto Atual do Mês (Completo)
  async recalcularGastoAtualMes(id_usuario, ano, mes, connection) {
      // Passo 1: Calcular soma na tabela de gastos
      const soma = await this.GastosModel.sum('valor', {
        where: {
          id_usuario: id_usuario,
          [Op.and]: [
            this.sequelize.where(this.sequelize.fn('YEAR', this.sequelize.col('data_gasto')), ano),
            this.sequelize.where(this.sequelize.fn('MONTH', this.sequelize.col('data_gasto')), mes)
          ]
        },
        transaction: connection
      });

      const valorTotal = soma || 0;

      // Passo 2: Atualizar tabela de totais
      await this.TotalGastosMesModel.update(
        { gastoAtualMes: valorTotal },
        {
          where: { id_usuario: id_usuario, ano, mes },
          transaction: connection
        }
      );

      return { gastoAtualMes: valorTotal };
  }

  // 5. Relatório de Gastos por Categoria
  async getGastosTotaisPorCategoria({ idUsuario, inicio, fim }) {
      const whereClause = { id_usuario: idUsuario };
      if (inicio && fim) {
        whereClause.data_gasto = { [Op.between]: [inicio, fim] };
      }

      const gastos = await this.GastosModel.findAll({
        attributes: [
          ['id_gasto', 'id_gasto'], 
          [this.sequelize.fn('DATE_FORMAT', this.sequelize.col('data_gasto'), '%Y-%m-%d'), 'data_gasto'],
          ['valor', 'valor'],
          ['descricao', 'descricao']
        ],
        include: [{
          model: this.CategoriasModel,
          as: 'categoria',
          attributes: [['id_categoria', 'id_categoria'], ['nome', 'nomeCategoria']],
          required: true // Inner Join
        }],
        where: whereClause,
        order: [
          [{ model: this.CategoriasModel, as: 'categoria' }, 'nome', 'ASC'],
          ['data_gasto', 'ASC'], 
          ['id_gasto', 'ASC']
        ],
        raw: true,
        nest: true
      });

      // Achata o objeto aninhado para o formato plano esperado
      return gastos.map(g => ({
        id_categoria: g.categoria.id_categoria,
        nomeCategoria: g.categoria.nomeCategoria,
        id_gasto: g.id_gasto,
        data_gasto: g.data_gasto,
        valor: g.valor,
        descricao: g.descricao || ''
      }));
  }

  // 6. Adicionar Gasto
  async addGasto(gastos, id_usuario, connection) {
      const novoGasto = await this.GastosModel.create({
        id_categoria: gastos.id_categoria,
        id_usuario: id_usuario,
        valor: gastos.valor,
        data_gasto: gastos.data_gasto,
        descricao: gastos.descricao || null,
        forma_pagamento: gastos.forma_pagamento || 'DEBITO',
        origem_lancamento: gastos.origem_lancamento || "manual",
        id_cartao: gastos.id_cartao || null
      }, { transaction: connection });

      return {
        // 🛡️ CORREÇÃO: Propriedade nativa do Sequelize baseada na coluna
        id_gasto: novoGasto.idGasto 
      };
  }

  async getSaldoAtual(id_usuario, connection) {
      // Usa UsuarioModel para buscar saldo
      const usuario = await this.UsuarioModel.findByPk(id_usuario, {
        attributes: ['saldoAtual'],
        transaction: connection
      });
      return usuario ? Number(usuario.saldoAtual) : 0;
  }

  // 8. Incrementar Gasto Atual Mês (Helper para os Listeners)
  async incrementarGastoAtualMes({ id_usuario, data_gasto, valor, connection }) {
      const dateObj = new Date(data_gasto);
      const ano = dateObj.getFullYear();
      const mes = dateObj.getMonth() + 1;

      // Abordagem mais robusta: SQL Raw para Upsert
      const sql = `
        INSERT INTO total_gastos_mes (id_usuario, ano, mes, limite_gasto_mes, gasto_atual_mes, created_at, updated_at)
        VALUES (:id_usuario, :ano, :mes, 0.00, :valor, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          gasto_atual_mes = gasto_atual_mes + :valor,
          updated_at = CURRENT_TIMESTAMP;
      `;

      await this.sequelize.query(sql, {
        replacements: {
          id_usuario,
          ano,
          mes,
          valor: Number(valor)
        },
        transaction: connection
      });
  }
}