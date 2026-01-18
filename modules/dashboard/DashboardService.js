import { Op } from 'sequelize';
// Imports dos Models
import UsuarioModel from '../../database/models/usuario/UsuarioModel.js';
import ReceitaModel from '../../database/models/receitas/ReceitaModel.js';
import GastosModel from '../../database/models/gastos/GastosModel.js';
import GastosFixosModel from '../../database/models/gastosFixos/GastosFixosModel.js';
import CartaoFaturaModel from '../../database/models/cartoesCredito/CartaoFaturaModel.js';

class DashboardService {

    /**
     * Calcula o resumo financeiro do mês
     */
    async getDashboardData(userId, mes, ano) {
        // Normaliza as datas sem depender da biblioteca 'moment' (para manter leve)
        const startDate = new Date(ano, mes - 1, 1);
        const endDate = new Date(ano, mes, 0, 23, 59, 59, 999);

        // Formatação YYYY-MM-DD para o Sequelize (DATEONLY)
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        try {
            // Executa todas as queries em PARALELO para performance máxima
            const [
                usuario,
                totalReceitas,
                totalGastosVariaveis,
                totalGastosFixos,
                totalFaturas,
                ultimasReceitas,
                ultimosGastos
            ] = await Promise.all([
                // 1. Saldo Atual (Snapshots)
                UsuarioModel.findByPk(userId, {
                    attributes: ['saldo_atual', 'nome']
                }),

                // 2. Total Receitas do Mês
                ReceitaModel.sum('valor', {
                    where: {
                        id_usuario: userId,
                        data_receita: { [Op.between]: [startStr, endStr] }
                    }
                }),

                // 3. Total Gastos Variáveis (Exclui Crédito e Fixos)
                GastosModel.sum('valor', {
                    where: {
                        id_usuario: userId,
                        data_gasto: { [Op.between]: [startStr, endStr] },
                        // Lógica: se forma_pagamento != CREDITO, é débito/dinheiro
                        forma_pagamento: { [Op.ne]: 'CREDITO' }, 
                        // Opcional: filtrar id_gasto_fixo null se quiser excluir pagamentos de fixos
                        id_gasto_fixo: null
                    }
                }),

                // 4. Previsão Gastos Fixos Ativos
                GastosFixosModel.sum('valor', {
                    where: {
                        id_usuario: userId,
                        ativo: true
                    }
                }),

                // 5. Faturas de Cartão no Mês
                CartaoFaturaModel.sum('total_lancamentos', {
                    where: {
                        id_usuario: userId,
                        mes: mes,
                        ano: ano
                    }
                }),

                // 6. Últimas 5 Receitas
                ReceitaModel.findAll({
                    where: { id_usuario: userId },
                    order: [['data_receita', 'DESC']],
                    limit: 5,
                    attributes: ['id_receita', 'descricao', 'valor', 'data_receita']
                }),

                // 7. Últimos 5 Gastos
                GastosModel.findAll({
                    where: { id_usuario: userId },
                    order: [['data_gasto', 'DESC']],
                    limit: 5,
                    include: ['categoria'], // Ensure association is defined in Model
                    attributes: ['id_gasto', 'descricao', 'valor', 'data_gasto', 'forma_pagamento']
                })
            ]);

            return this.formatarResposta({
                usuario,
                totalReceitas,
                totalGastosVariaveis,
                totalGastosFixos,
                totalFaturas,
                ultimasReceitas,
                ultimosGastos
            });

        } catch (error) {
            console.error("Erro no DashboardService:", error);
            throw new Error("Falha ao processar dados do dashboard");
        }
    }

    /**
     * Helper para formatar o JSON de resposta (Separation of Concerns)
     */
    formatarResposta(data) {
        const saldo = Number(data.usuario?.saldo_atual || 0);
        const receitas = Number(data.totalReceitas || 0);
        const variaveis = Number(data.totalGastosVariaveis || 0);
        const fixos = Number(data.totalGastosFixos || 0);
        const faturas = Number(data.totalFaturas || 0);
        
        const totalDespesas = variaveis + fixos + faturas;

        // Merge e sort das transações recentes
        const transacoes = [
            ...data.ultimasReceitas.map(r => ({
                id: `r-${r.id_receita}`,
                titulo: r.descricao || 'Receita',
                valor: Number(r.valor),
                data: r.data_receita,
                tipo: 'receita',
                icone: 'arrow-up'
            })),
            ...data.ultimosGastos.map(g => ({
                id: `g-${g.id_gasto}`,
                titulo: g.descricao || 'Despesa',
                valor: Number(g.valor),
                data: g.data_gasto,
                tipo: 'despesa',
                icone: g.forma_pagamento === 'CREDITO' ? 'credit-card' : 'arrow-down'
            }))
        ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

        return {
            usuario: { nome: data.usuario?.nome },
            cards: {
                saldoAtual: saldo,
                receitas: receitas,
                despesas: totalDespesas,
                balanco: receitas - totalDespesas
            },
            detalheDespesas: {
                gastosFixos: fixos,
                gastosVariaveis: variaveis,
                faturasCartao: faturas
            },
            transacoesRecentes: transacoes,
            graficoDados: [ // Estrutura pronta para Recharts/Victory
                { name: 'Fixos', value: fixos, color: '#3b82f6' },
                { name: 'Variáveis', value: variaveis, color: '#22c55e' },
                { name: 'Faturas', value: faturas, color: '#f59e0b' }
            ]
        };
    }
}

export default new DashboardService();