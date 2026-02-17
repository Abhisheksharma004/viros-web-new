import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'viros_website',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10 seconds
});

// Handle pool errors
pool.on('connection', (connection) => {
    console.log('New database connection established');
    connection.on('error', (err) => {
        console.error('Database connection error:', err);
    });
});

export default pool;
