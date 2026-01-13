
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    let connection;
    try {
        const dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        };

        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const migrationPath = path.join(__dirname, 'migrations', 'create_navbar_content_table.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        await connection.query(migrationSql);
        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
