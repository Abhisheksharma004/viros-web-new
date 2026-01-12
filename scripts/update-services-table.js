const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function updateServicesTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'viros_web_new',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Updating services table schema...');

        // Add missing columns
        await connection.query(`
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS features JSON AFTER gradient
        `);
        console.log('✓ Added features column');

        await connection.query(`
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS benefits JSON AFTER features
        `);
        console.log('✓ Added benefits column');

        await connection.query(`
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS specifications JSON AFTER benefits
        `);
        console.log('✓ Added specifications column');

        console.log('✅ Services table updated successfully!');
    } catch (error) {
        console.error('❌ Error updating table:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

updateServicesTable();
