export default class DashboardController {
    
    // Injeção de dependência no construtor
    constructor(dashboardService) {
        this.service = dashboardService;
    }

    async getSummary(req, res, next) {
        try {
            const userId = req.user.id;
            console.log("userId: ", userId);
            
            const hoje = new Date();
            const mes = req.query.mes ? parseInt(req.query.mes) : (hoje.getMonth() + 1);
            const ano = req.query.ano ? parseInt(req.query.ano) : hoje.getFullYear();
            console.log("mes: ", mes, "ano: ", ano);

            const dados = await this.service.gerarDashboard(userId, mes, ano);

            return res.status(200).json(dados);

        } catch (error) {
            next(error);
        }
    }
}