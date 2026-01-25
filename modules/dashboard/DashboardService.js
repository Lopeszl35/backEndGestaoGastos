export default class DashboardService {
    
    // Injeção de dependência no construtor
    constructor(dashboardRepository) {
        this.repository = dashboardRepository;
    }

    async gerarDashboard(idUsuario, mes, ano) {
        const dataInicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
        const dataFim = new Date(ano, mes, 0).toISOString().split('T')[0];

        const [
            usuarioDados,
            totalReceitas,
            totalVariaveis,
            totalFixos,
            totalFaturas,
            listaReceitas,
            listaGastos
        ] = await Promise.all([
            this.repository.buscarSaldoUsuario(idUsuario),
            this.repository.somarReceitasNoPeriodo(idUsuario, dataInicio, dataFim),
            this.repository.somarGastosVariaveisNoPeriodo(idUsuario, dataInicio, dataFim),
            this.repository.somarGastosFixosAtivos(idUsuario),
            this.repository.buscarFaturaDoMes(idUsuario, mes, ano),
            this.repository.buscarUltimasReceitas(idUsuario, 5),
            this.repository.buscarUltimosGastos(idUsuario, 5)
        ]);

        const saldoAtual = Number(usuarioDados?.saldoAtual || 0);
        const receitas = Number(totalReceitas);
        const variaveis = Number(totalVariaveis);
        const fixos = Number(totalFixos);
        const faturas = Number(totalFaturas);
        const totalDespesas = variaveis + fixos + faturas;

        const transacoesNormalizadas = this.normalizarTransacoes(listaReceitas, listaGastos);

        return {
            usuario: {
                nome: usuarioDados?.nome
            },
            resumoFinanceiro: {
                saldoAtual,
                receitas,
                despesas: totalDespesas.toFixed(2),
                balanco: receitas.toFixed(2) - totalDespesas.toFixed(2)
            },
            detalhamentoDespesas: {
                fixas: fixos,
                variaveis: variaveis,
                cartaoCredito: faturas
            },
            feedTransacoes: transacoesNormalizadas,
            graficos: [
                { name: 'Fixos', value: fixos, color: '#3b82f6' },
                { name: 'Variáveis', value: variaveis, color: '#22c55e' },
                { name: 'Fatura', value: faturas, color: '#f59e0b' }
            ]
        };
    }

    normalizarTransacoes(receitas, gastos) {
        const _receitas = receitas.map(r => ({
            id: `r-${r.idReceita}`,
            titulo: r.descricao || 'Receita',
            valor: Number(r.valor),
            data: r.dataReceita,
            tipo: 'receita',
            categoria: 'Entrada'
        }));

        const _gastos = gastos.map(g => ({
            id: `g-${g.idGasto}`,
            titulo: g.descricao || 'Despesa',
            valor: Number(g.valor),
            data: g.dataGasto,
            tipo: 'despesa',
            categoria: g.categoria?.nome || 'Geral',
            metodo: g.formaPagamento
        }));

        return [..._receitas, ..._gastos]
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10);
    }
}