const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'viros_web_new'
    });

    try {
        console.log('🔑 Starting password reset OTP table migration...\n');

        const migrationSQL = await fs.readFile(
            path.join(__dirname, '..', 'migrations', 'create_password_reset_otps_table.sql'),
            'utf-8'
        );

        await connection.query(migrationSQL);
        console.log('✅ Password reset OTP table created successfully!\n');

        // Verify table was created
        const [rows] = await connection.query('SHOW TABLES LIKE "password_reset_otps"');
        if (rows.length > 0) {
            console.log('✅ Table verification passed\n');
            
            // Show table structure
            const [columns] = await connection.query('DESCRIBE password_reset_otps');
            console.log('📋 Table structure:');
            console.table(columns);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
