const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function cleanTablespaces() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Cleaning up database...');

        // Drop and recreate the database
        const dbName = process.env.DB_NAME || 'viros_web_new';
        
        console.log(`Dropping database ${dbName}...`);
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        
        console.log(`Creating database ${dbName}...`);
        await connection.query(`CREATE DATABASE ${dbName}`);
        
        console.log(`\n✅ Database ${dbName} cleaned successfully!`);
        console.log('Now run: node scripts/init-all-tables.js');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

cleanTablespaces();
