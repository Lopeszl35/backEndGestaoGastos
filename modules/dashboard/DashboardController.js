export default class DashboardController {
    
    // Injeção de dependência no construtor
    constructor(dashboardService) {
        this.service = dashboardService;
    }

    // Arrow function ou bind é necessário se não usar DependencyInjector corretamente, 
    // mas no seu padrão, chamaremos explicitamente no router.
    async getSummary(req, res, next) {
        try {
            const userId = req.user.id;
            
            const hoje = new Date();
            const mes = req.query.mes ? parseInt(req.query.mes) : (hoje.getMonth() + 1);
            const ano = req.query.ano ? parseInt(req.query.ano) : hoje.getFullYear();

            // Usa 'this.service' que foi injetado
            const dados = await this.service.gerarDashboard(userId, mes, ano);

            return res.status(200).json(dados);

        } catch (error) {
            next(error);
        }
    }
}