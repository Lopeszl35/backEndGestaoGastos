import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

function pick(nameA, valA, nameB, valB) {
  const v = valA ?? valB;
  if (!v) throw new Error(`Env ausente: (${nameA}) ou (${nameB})`);
  return v;
}

class Database {
  static instance;

  constructor() {
    if (Database.instance) {
      throw new Error(
        "A classe Database deve ser instanciada somente uma vez!"
      );
    }

    // ✅ Prioriza Railway (MYSQL*) e faz fallback para DB_*_PROD
    const host = pick(
      "MYSQLHOST",
      process.env.MYSQLHOST,
      "DB_HOST",
      process.env.DB_HOST
    );
    const port = Number(
      pick(
        "MYSQLPORT",
        process.env.MYSQLPORT,
        "DB_PORT",
        process.env.DB_PORT
      ) || 3306
    );
    const user = pick(
      "MYSQLUSER",
      process.env.MYSQLUSER,
      "DB_USER",
      process.env.DB_USER
    );
    const password = pick(
      "MYSQLPASSWORD",
      process.env.MYSQLPASSWORD,
      "DB_PASS",
      process.env.DB_PASS
    );
    const database = pick(
      "MYSQLDATABASE",
      process.env.MYSQLDATABASE,
      "DB_NAME",
      process.env.DB_NAME
    );

    console.log("DB CONFIG (sanity):", { host, port, user, database });

    this.pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,

      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000,
    });

    console.log("✅ Pool MySQL (mysql2) criado com sucesso!");
  }

  static getInstance() {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  async executaComando(sql, params = []) {
    // ✅ não precisa getConnection manual; pool.query já gerencia
    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  async executaComandoNonQuery(sql, params = []) {
    const [result] = await this.pool.query(sql, params);
    return result?.affectedRows ?? 0;
  }

  async beginTransaction() {
    const conn = await this.pool.getConnection();
    await conn.beginTransaction();
    return conn;
  }

  async commitTransaction(conn) {
    try {
      await conn.commit();
    } finally {
      conn.release();
    }
  }

  async rollbackTransaction(conn) {
    if (!conn) return;
    try {
      await conn.rollback();
    } finally {
      conn.release();
    }
  }
}

export default Database;
