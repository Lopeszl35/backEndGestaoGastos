import { GastosModel, TotalGastosMesModel, CategoriasModel, UsuarioModel } from "../../database/models/index.js";
import { sequelize } from "../../database/sequelize.js";
import { Op, QueryTypes } from "sequelize";
import ErroSqlHandler from "../../errors/ErroSqlHandler.js";

export default class GastoMesRepository {
  constructor() {}

  // 1. Configurar Limite (Upsert)
  async configGastoLimiteMes(id_usuario, dadosMes, connection) {
    console.log("GastoMesRepository.configGastoLimiteMes chamado com:", { id_usuario, dadosMes });
    try {
      const { ano, mes, limiteGastoMes } = dadosMes;

      // Usando UPSERT do Sequelize (compatível com MySQL 'ON DUPLICATE KEY UPDATE')
      await TotalGastosMesModel.upsert({
        idUsuario: id_usuario,
        ano: Number(ano),
        mes: Number(mes),
        limiteGastoMes: Number(limiteGastoMes),
        // Se for insert, gastoAtualMes começa com 0 (default do model), ou podemos forçar
        // Se for update, ele mantém o valor atual a menos que especifiquemos. 
        // O Sequelize upsert atualiza os campos passados.
      }, { transaction: connection });

      return {
        mensagem: "Configuração mensal salva com sucesso.",
        id_usuario: Number(id_usuario),
        ano: Number(ano),
        mes: Number(mes),
        limite_gasto_mes: Number(limiteGastoMes)
      };
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 2. Obter Limite
  async getLimiteGastosMes(id_usuario, ano, mes) {
    try {
      const resultado = await TotalGastosMesModel.findOne({
        where: { idUsuario: id_usuario, ano, mes },
        raw: true
      });
      console.log("getLimiteGastosMesRows: ", resultado);
      // Retorna array para manter compatibilidade com código antigo que espera rows[0]
      return resultado ? [resultado] : [];
    } catch (error) {
      console.error("Erro no GastoMesRepository.getLimiteGastosMes:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 3. Atualizar Limite (Função que faltava)
  async atualizarLimite(id_usuario, limite_gasto_mes, connection) {
    try {
      const [affectedRows] = await TotalGastosMesModel.update(
        { limiteGastoMes: limite_gasto_mes },
        { 
          where: { idUsuario: id_usuario },
          transaction: connection
        }
      );
      return { mensagem: "Limite atualizado com sucesso.", result: { affectedRows } };
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 4. Recalcular Gasto Atual do Mês (Completo)
  async recalcularGastoAtualMes(id_usuario, ano, mes, connection) {
    try {
      // Passo 1: Calcular soma na tabela de gastos
      const soma = await GastosModel.sum('valor', {
        where: {
          idUsuario: id_usuario,
          [Op.and]: [
            sequelize.where(sequelize.fn('YEAR', sequelize.col('data_gasto')), ano),
            sequelize.where(sequelize.fn('MONTH', sequelize.col('data_gasto')), mes)
          ]
        },
        transaction: connection
      });

      const valorTotal = soma || 0;

      // Passo 2: Atualizar tabela de totais
      await TotalGastosMesModel.update(
        { gastoAtualMes: valorTotal },
        {
          where: { idUsuario: id_usuario, ano, mes },
          transaction: connection
        }
      );

      return {
        mensagem: "Gasto atual do mês recalculado.",
        ano,
        mes,
        result: { gastoAtualMes: valorTotal }
      };
    } catch (error) {
      console.error("Erro no GastoMesRepository.recalcularGastoAtualMes:", error.message);
      throw error;
    }
  }

  // 5. Relatório de Gastos por Categoria
  async getGastosTotaisPorCategoria({ idUsuario, inicio, fim }) {
    try {
      const whereClause = { idUsuario: idUsuario };
      if (inicio && fim) {
        whereClause.dataGasto = { [Op.between]: [inicio, fim] };
      }

      const gastos = await GastosModel.findAll({
        attributes: [
          ['id_gasto', 'id_gasto'], // Aliases para manter compatibilidade exata
          [sequelize.fn('DATE_FORMAT', sequelize.col('data_gasto'), '%Y-%m-%d'), 'data_gasto'],
          ['valor', 'valor'],
          ['descricao', 'descricao']
        ],
        include: [{
          model: CategoriasModel,
          as: 'categoria',
          attributes: [['id_categoria', 'id_categoria'], ['nome', 'nomeCategoria']],
          required: true // Inner Join
        }],
        where: whereClause,
        order: [
          [{ model: CategoriasModel, as: 'categoria' }, 'nome', 'ASC'],
          ['dataGasto', 'ASC'], // Sequelize usa o nome do atributo do model no order
          ['idGasto', 'ASC']
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

    } catch (error) {
      console.error("Erro getGastosTotaisPorCategoria:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 6. Adicionar Gasto
  async addGasto(gastos, id_usuario, connection) {
    try {
      const novoGasto = await GastosModel.create({
        idCategoria: gastos.id_categoria,
        idUsuario: id_usuario,
        valor: gastos.valor,
        dataGasto: gastos.data_gasto,
        descricao: gastos.descricao || null,
        formaPagamento: gastos.forma_pagamento || null,
        origemLancamento: gastos.origem_lancamento || "manual",
        idCartao: gastos.id_cartao || null
      }, { transaction: connection });

      return {
        mensagem: "Gasto adicionado com sucesso.",
        id_gasto: novoGasto.idGasto // Retorna ID gerado
      };
    } catch (error) {
      console.error("Erro addGasto:", error);
      throw error;
    }
  }

  // 7. Obter Saldo Atual (Função que faltava)
  async getSaldoAtual(id_usuario, connection) {
    try {
      // Usa UsuarioModel para buscar saldo
      const usuario = await UsuarioModel.findByPk(id_usuario, {
        attributes: ['saldoAtual'],
        transaction: connection
      });
      return usuario ? Number(usuario.saldoAtual) : 0;
    } catch (error) {
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }

  // 8. Incrementar Gasto Atual Mês (Helper para os Listeners)
  async incrementarGastoAtualMes({ id_usuario, data_gasto, valor, connection }) {
    // Extrai ano/mes da data
    const dateObj = new Date(data_gasto);
    const ano = dateObj.getFullYear();
    const mes = dateObj.getMonth() + 1; // JS month é 0-11

    try {
      // Find or Create garante que o registro exista
      const [registro, created] = await TotalGastosMesModel.findOrCreate({
        where: { idUsuario: id_usuario, ano, mes },
        defaults: {
          limiteGastoMes: 0.00,
          gastoAtualMes: 0.00
        },
        transaction: connection
      });

      // Incrementa atomicamente
      await registro.increment('gastoAtualMes', { by: valor, transaction: connection });

      return { mensagem: "Gasto do mês incrementado com sucesso." };
    } catch (error) {
      console.error("Erro incrementarGastoAtualMes:", error.message);
      ErroSqlHandler.tratarErroSql(error);
      throw error;
    }
  }
}