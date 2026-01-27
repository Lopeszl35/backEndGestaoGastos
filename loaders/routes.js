import DependencyInjector from "../utils/DependencyInjector.js";
import manipulador404 from "../middleware/manipulador404.js";
import manipuladorDeErros from "../middleware/manipuladorDeErros.js";

export default async ({ app }) => {
  console.log("🛣️ Configurando Rotas...");

  // Carrega definições de rota
  const { default: routerTest } = await import("../modules/routes/routerTest.js");
  const { default: UserRoutes } = await import("../modules/usuario/UserRoutes.js");
  const { default: CategoriasRoutes } = await import("../modules/categorias/CategoriasRoutes.js");
  const { default: GastoMesRoutes } = await import("../modules/gastos/GastoMesRoutes.js");
  const { default: GastosFixosRoutes } = await import("../modules/gastos_fixos/GastosFixosRoutes.js");
  const { default: CartoesRoutes } = await import("../modules/cartoes/CartoesRoutes.js");
  const { default: FinanciamentosRoutes } = await import("../modules/financiamento/FinanciamentosRoutes.js");
  const { default: DashboradRoutes } = await import("../modules/dashboard/DashboardRoutes.js");

  // Rotas Específicas PRIMEIRO (Boas práticas do Express)
  app.use(routerTest);
  app.use(UserRoutes(DependencyInjector.get("UserController")));
  app.use(CategoriasRoutes(DependencyInjector.get("CategoriasController")));
  app.use(GastoMesRoutes(DependencyInjector.get("GastoMesController")));
  app.use(GastosFixosRoutes(DependencyInjector.get("GastosFixosController")));
  
  // ✅ CORREÇÃO: Mudei de "/api/" para "/api" (sem barra final) e movi para uma ordem segura
  // Mas o ideal é não usar "/api/" genérico se as rotas internas já tem prefixo.
  // Vamos manter o padrão, mas coloque rotas mais específicas antes.
  
  app.use("/api/financiamentos", FinanciamentosRoutes(DependencyInjector.get("FinanciamentosController")));
  app.use("/api/dashboard", DashboradRoutes(DependencyInjector.get("DashboardController")));
  
  // ✅ A rota de cartões deve ser tratada com cuidado. 
  // No CartoesRoutes.js, as rotas são definidas como "/cartoes/...".
  // Então se usarmos app.use("/api", ...), a rota final será "/api/cartoes/...".
  app.use("/api", CartoesRoutes(DependencyInjector.get("CartoesController")));

  // Middlewares Finais
  app.use(manipulador404);
  app.use(manipuladorDeErros);
  
  console.log("✅ Rotas configuradas.");
};