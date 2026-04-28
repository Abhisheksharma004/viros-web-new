const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'create_whats_new_table.sql'), 'utf8');
        await connection.query(sql);
        console.log('✅ Whats New table migration executed successfully');
    } catch (error) {
        console.error('❌ Error executing migration:', error);
    } finally {
        await connection.end();
    }
}

runMigration();
