// loaders/container.js
import DependencyInjector from "../utils/DependencyInjector.js";

export default async ({ database }) => {
  console.log("💉 Carregando container de dependências...");

  // ===========================================================================
  // 1. Core Utils (Bases do Sistema)
  // ===========================================================================
  const { default: TransactionUtil } = await import("../utils/TransactionUtil.js");
  DependencyInjector.register("TransactionUtil", new TransactionUtil(database));

  const { default: BarramentoEventos } = await import("../utils/BarramentoEventos.js");
  DependencyInjector.register("BarramentoEventos", new BarramentoEventos());

  // ===========================================================================
  // 2. Repositories (Camada de Dados)
  // ===========================================================================
  
  // -- Usuário & Categoria
  const { default: UserRepository } = await import("../modules/usuario/userRepository.js");
  const { default: CategoriasRepository } = await import("../modules/categorias/categoriasRepository.js");
  DependencyInjector.register("UserRepository", new UserRepository(database));
  DependencyInjector.register("CategoriasRepository", new CategoriasRepository(database));

  // -- Financeiro (Gastos, Fixos, Financiamento)
  const { default: GastoMesRepository } = await import("../modules/gastos/GastoMesRepository.js");
  const { default: GastosFixosRepository } = await import("../modules/gastos_fixos/GastosFixosRepository.js");
  const { default: FinanciamentosRepository } = await import("../modules/financiamento/FinanciamentosRepository.js");
  
  DependencyInjector.register("GastoMesRepository", new GastoMesRepository(database));
  DependencyInjector.register("GastosFixosRepository", new GastosFixosRepository(database));
  DependencyInjector.register("FinanciamentosRepository", new FinanciamentosRepository()); 

  // -- Cartões (ORM)
  const { CartoesRepositorioORM } = await import("../modules/cartoes/repositories/CartoesRepositorioORM.js");
  const { CartaoFaturasRepositorioORM } = await import("../modules/cartoes/repositories/CartaoFaturasRepositorioORM.js");
  const { CartaoLancamentosRepositorioORM } = await import("../modules/cartoes/repositories/CartaoLancamentosRepositorioORM.js");
  
  DependencyInjector.register("CartoesRepositorioORM", new CartoesRepositorioORM());
  DependencyInjector.register("CartaoFaturasRepositorioORM", new CartaoFaturasRepositorioORM());
  DependencyInjector.register("CartaoLancamentosRepositorioORM", new CartaoLancamentosRepositorioORM());

  // -- Alertas
  const { default: AlertasRepository } = await import("../modules/alertas/AlertasRepository.js");
  DependencyInjector.register("AlertasRepository", new AlertasRepository(database));

  // -- Investimentos
  const { default: InvestimentosRepository } = await import("../modules/investimentos/InvestimentosRepository.js");
  DependencyInjector.register("InvestimentosRepository", new InvestimentosRepository(database));

  // -- Dashboard
  const { DashboardRepository } = await import("../modules/dashboard/DashboardRepository.js");
  DependencyInjector.register("DashboardRepository", new DashboardRepository());

  // ===========================================================================
  // 3. Services (Regras de Negócio)
  // ===========================================================================

  // -- Core Services
  const { default: UserService } = await import("../modules/usuario/UserService.js");
  const { default: CategoriasService } = await import("../modules/categorias/CategoriasService.js");
  const { default: NotificacoesService } = await import("../modules/alertas/NotificacoesService.js");

  DependencyInjector.register("UserService", new UserService(DependencyInjector.get("UserRepository")));
  DependencyInjector.register("CategoriasService", new CategoriasService(DependencyInjector.get("CategoriasRepository")));
  DependencyInjector.register("NotificacoesService", new NotificacoesService());

  // -- Cartões Service
  const { CartoesService } = await import("../modules/cartoes/CartoesService.js");
  DependencyInjector.register("CartoesService", new CartoesService({
    cartoesRepositorio: DependencyInjector.get("CartoesRepositorioORM"),
    faturasRepositorio: DependencyInjector.get("CartaoFaturasRepositorioORM"),
    lancamentosRepositorio: DependencyInjector.get("CartaoLancamentosRepositorioORM"),
    barramentoEventos: DependencyInjector.get("BarramentoEventos"),
  }));

  // -- Mercado Service (Cuida de Cotações E Notícias)
  const { default: MercadoService } = await import("../modules/mercado/MercadoService.js");
  DependencyInjector.register("MercadoService", new MercadoService());

  // -- Financeiro Services
  const { default: GastoMesService } = await import("../modules/gastos/GastoMesService.js");
  const { default: GastosFixosService } = await import("../modules/gastos_fixos/GastosFixosService.js");
  const { default: FinanciamentosService } = await import("../modules/financiamento/FinanciamentosService.js");

  DependencyInjector.register("GastoMesService", new GastoMesService(
    DependencyInjector.get("GastoMesRepository"),
    DependencyInjector.get("BarramentoEventos"),
    DependencyInjector.get("CartoesService") 
  ));

  DependencyInjector.register("GastosFixosService", new GastosFixosService(DependencyInjector.get("GastosFixosRepository")));
  
  DependencyInjector.register("FinanciamentosService", new FinanciamentosService(
    DependencyInjector.get("FinanciamentosRepository"),
    DependencyInjector.get("BarramentoEventos")
  ));

  // -- Investimentos Service
  const { default: InvestimentosService } = await import("../modules/investimentos/InvestimentosService.js");
  DependencyInjector.register("InvestimentosService", new InvestimentosService(
    DependencyInjector.get("InvestimentosRepository"),
    DependencyInjector.get("MercadoService") 
  ));

  // -- Alertas Service
  const { default: AlertasService } = await import("../modules/alertas/AlertasService.js");
  DependencyInjector.register("AlertasService", new AlertasService(
    DependencyInjector.get("AlertasRepository"),
    DependencyInjector.get("NotificacoesService")
  ));

  // -- Dashboard Service
  const { default: DashboardService } = await import("../modules/dashboard/DashboardService.js");
  DependencyInjector.register("DashboardService", new DashboardService(
      DependencyInjector.get("DashboardRepository") 
  ));

  // ===========================================================================
  // 4. Controllers (Entrada de Dados)
  // ===========================================================================
  const { default: UserController } = await import("../modules/usuario/userController.js");
  const { default: CategoriasController } = await import("../modules/categorias/categoriasController.js");
  const { default: GastoMesController } = await import("../modules/gastos/GastoMesController.js");
  const { default: GastosFixosController } = await import("../modules/gastos_fixos/GastosFixosController.js");
  const { default: FinanciamentosController } = await import("../modules/financiamento/FinanciamentosController.js");
  const { CartoesController } = await import("../modules/cartoes/CartoesController.js");
  const { default: DashboardController } = await import("../modules/dashboard/DashboardController.js");
  
  // Novos Controllers
  const { default: MercadoController } = await import("../modules/mercado/MercadoController.js");
  const { default: InvestimentosController } = await import("../modules/investimentos/InvestimentosController.js");

  const txUtil = DependencyInjector.get("TransactionUtil");

  DependencyInjector.register("UserController", new UserController(DependencyInjector.get("UserService"), txUtil));
  DependencyInjector.register("CategoriasController", new CategoriasController(DependencyInjector.get("CategoriasService"), txUtil));
  DependencyInjector.register("GastoMesController", new GastoMesController(DependencyInjector.get("GastoMesService"), txUtil));
  DependencyInjector.register("GastosFixosController", new GastosFixosController(DependencyInjector.get("GastosFixosService")));
  DependencyInjector.register("FinanciamentosController", new FinanciamentosController(DependencyInjector.get("FinanciamentosService"), txUtil));
  DependencyInjector.register("CartoesController", new CartoesController(DependencyInjector.get("CartoesService")));
  DependencyInjector.register("DashboardController", new DashboardController(DependencyInjector.get("DashboardService")));

  // Registrando Controller de Mercado (Cotações e Notícias)
  DependencyInjector.register("MercadoController", new MercadoController(DependencyInjector.get("MercadoService")));
  
  // Registrando Controller de Investimentos
  DependencyInjector.register("InvestimentosController", new InvestimentosController(
    DependencyInjector.get("InvestimentosService"),
    txUtil
  ));

  // ===========================================================================
  // 5. Listeners (Domain Events)
  // ===========================================================================
  const { default: registrarListenersDeGastos } = await import("../modules/gastos/registrarListenersDeGastos.js");
  registrarListenersDeGastos({
    barramentoEventos: DependencyInjector.get("BarramentoEventos"),
    gastoMesRepository: DependencyInjector.get("GastoMesRepository"),
    alertasService: DependencyInjector.get("AlertasService"),
    userRepository: DependencyInjector.get("UserRepository"),
    cartoesService: DependencyInjector.get("CartoesService"),
    categoriasRepository: DependencyInjector.get("CategoriasRepository"),
  });

  const { default: registrarListenersDeCartoes } = await import("../modules/cartoes/registrarListenersDeCartoes.js");
  registrarListenersDeCartoes({
    barramentoEventos: DependencyInjector.get("BarramentoEventos"),
    userService: DependencyInjector.get("UserService"),
    gastoMesRepository: DependencyInjector.get("GastoMesRepository"),
  });

  const { default: registrarListenersDeFinanciamentos } = await import("../modules/financiamento/registrarListenersDeFinanciamentos.js");
  registrarListenersDeFinanciamentos({
    barramentoEventos: DependencyInjector.get("BarramentoEventos"),
    gastoMesService: DependencyInjector.get("GastoMesService"),
    userRepository: DependencyInjector.get("UserRepository"),
  });

  console.log("✅ Container de dependências carregado.");
};