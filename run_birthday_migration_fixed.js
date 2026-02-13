const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('✅ Connected successfully!');
        
        // Drop table if exists (to fix any corruption)
        console.log('Dropping existing birthdays table if it exists...');
        await connection.query('DROP TABLE IF EXISTS birthdays');
        console.log('✅ Old table dropped');

        // Read and execute migration SQL
        const sql = fs.readFileSync(
            path.join(__dirname, 'migrations', 'create_birthdays_table.sql'), 
            'utf8'
        );
        
        console.log('Creating birthdays table...');
        await connection.query(sql);
        
        console.log('✅ Birthday table created successfully!');
        
        // Verify table was created
        const [result] = await connection.query('DESCRIBE birthdays');
        console.log('\nTable structure:');
        console.table(result);
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        console.error('Full error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

runMigration();
