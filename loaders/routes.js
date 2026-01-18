// loaders/routes.js
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

  // Injeta no Express
  app.use(routerTest);
  app.use(UserRoutes(DependencyInjector.get("UserController")));
  app.use(CategoriasRoutes(DependencyInjector.get("CategoriasController")));
  app.use(GastoMesRoutes(DependencyInjector.get("GastoMesController")));
  app.use(GastosFixosRoutes(DependencyInjector.get("GastosFixosController")));
  app.use("/api/", CartoesRoutes(DependencyInjector.get("CartoesController")));
  app.use("/api/financiamentos", FinanciamentosRoutes(DependencyInjector.get("FinanciamentosController")));

  // Middlewares Finais (404 e Erro)
  app.use(manipulador404);
  app.use(manipuladorDeErros);
  
  console.log("✅ Rotas configuradas.");
};