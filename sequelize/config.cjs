require('dotenv').config(); 

module.exports = {
  // Configuração padrão usada pelo 'npm run db:migrate'
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: console.log, // Útil para ver o SQL em desenvolvimento
    timezone: "-03:00",
  },
  // Configuração usada se você rodar 'NODE_ENV=production npm run db:migrate'
  production: {
    username: process.env.DB_USER_PROD,
    password: process.env.DB_PASS_PROD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST_PROD,
    port: Number(process.env.DB_PORT_PROD || 3306),
    dialect: "mysql",
    logging: false,
    timezone: "-03:00",
  },
};