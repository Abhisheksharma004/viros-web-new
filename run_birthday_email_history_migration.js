const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'viros_web_new',
            port: parseInt(process.env.DB_PORT || '3306')
        });

        console.log('✅ Connected to database');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'create_birthday_email_history_table.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

        // Execute the migration
        await connection.query(migrationSQL);

        console.log('✅ Birthday email history table created successfully!');
        console.log('\nTable structure:');
        console.log('- id (Primary Key)');
        console.log('- birthday_id (Foreign Key to birthdays table)');
        console.log('- recipient_email');
        console.log('- recipient_name');
        console.log('- sent_at');
        console.log('- status (sent/failed/pending)');
        console.log('- message_id');
        console.log('- error_message');
        console.log('- celebration_time');
        console.log('- department');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
