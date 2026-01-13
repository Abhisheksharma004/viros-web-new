
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'create_departments_table.sql'), 'utf8');
        await connection.query(sql);
        console.log('Departments migration executed successfully');
    } catch (error) {
        console.error('Error executing migration:', error);
    } finally {
        await connection.end();
    }
}

runMigration();
