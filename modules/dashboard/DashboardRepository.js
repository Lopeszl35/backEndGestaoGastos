import { Op } from "sequelize";
import { UsuarioModel } from "../../database/models/usuario/UsuarioModel.js";
import { ReceitaModel } from "../../database/models/receitas/ReceitaModel.js";
import { GastosModel } from "../../database/models/gastos/GastosModel.js";
import { GastosFixosModel } from "../../database/models/gastosFixos/GastosFixosModel.js";
import { CartaoFaturaModel } from "../../database/models/cartoesCredito/CartaoFaturaModel.js";
import { CategoriasModel } from "../../database/models/categorias/CategoriasModel.js";

export class DashboardRepository {
    
    async buscarSaldoUsuario(idUsuario) {
        return await UsuarioModel.findByPk(idUsuario, {
            attributes: ['saldoAtual', 'nome'],
        });
    }

    async somarReceitasNoPeriodo(idUsuario, dataInicio, dataFim) {
        const total = await ReceitaModel.sum('valor', {
            where: {
                id_usuario: idUsuario,
                dataReceita: { [Op.between]: [dataInicio, dataFim] }
            }
        });
        return total || 0;
    }

    async somarGastosVariaveisNoPeriodo(idUsuario, dataInicio, dataFim) {
        const total = await GastosModel.sum('valor', {
            where: {
                id_usuario: idUsuario,
                data_gasto: { [Op.between]: [dataInicio, dataFim] },
                forma_pagamento: { [Op.ne]: 'CREDITO' },
                id_gasto_fixo: null
            }
        });
        return total || 0;
    }

    async somarGastosFixosAtivos(idUsuario) {
        const total = await GastosFixosModel.sum('valor', {
            where: {
                id_usuario: idUsuario,
                ativo: 1
            }
        });
        return total || 0;
    }

    async buscarFaturaDoMes(idUsuario, mes, ano) {
        const total = await CartaoFaturaModel.sum('total_lancamentos', {
            where: {
                id_usuario: idUsuario,
                mes: mes,
                ano: ano
            }
        });
        return total || 0;
    }

    async buscarUltimasReceitas(idUsuario, limite = 5) {
        return await ReceitaModel.findAll({
            where: { id_usuario: idUsuario },
            order: [['dataReceita', 'DESC']],
            limit: limite,
            attributes: ['idReceita', 'descricao', 'valor', 'dataReceita', 'origemLancamento']
        });
    }

    async buscarUltimosGastos(idUsuario, limite = 5) {
        return await GastosModel.findAll({
            where: { id_usuario: idUsuario },
            order: [['data_gasto', 'DESC']],
            limit: limite,
            include: [{
                model: CategoriasModel,
                as: 'categoria', 
                attributes: ['nome'],
                required: false
            }],
            attributes: ['id_gasto', 'descricao', 'valor', 'data_gasto', 'forma_pagamento']
        });
    }
}