import mysql from "mysql2/promise";

declare global {
    // eslint-disable-next-line no-var
    var __virosMysqlPool: mysql.Pool | undefined;
}

function createPool() {
    return mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
        database: process.env.DB_NAME || "viros_website",
        port: parseInt(process.env.DB_PORT || "3306", 10),
        waitForConnections: true,
        connectionLimit: Number.parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
        maxIdle: 5,
        idleTimeout: 60_000,
        queueLimit: 0,
        connectTimeout: 10_000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10_000,
    });
}

const pool = global.__virosMysqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
    global.__virosMysqlPool = pool;
}

pool.on("connection", (connection) => {
    connection.on("error", (err) => {
        console.error("Database connection error:", err);
    });
});

export default pool;
