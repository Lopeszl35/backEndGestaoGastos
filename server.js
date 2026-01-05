import dotenv from "dotenv";
dotenv.config();


const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE","PATCH"], allowedHeaders: ["Content-Type","Authorization"], credentials: true }));
app.use(morgan("dev"));

app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000*60*60*24, secure: false, httpOnly: true, sameSite: "lax" }
}));

const initializeServer = async () => {
  try {
    // ✅ só rota de teste (sem DI e sem banco)
    const { default: routerTest } = await import("./modules/routes/routerTest.js");
    app.use(routerTest);

    app.use(manipulador404);
    app.use(manipuladorDeErros);

    console.log("Rotas carregadas com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar o servidor:", error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

initializeServer().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
