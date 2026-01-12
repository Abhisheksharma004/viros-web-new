const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function repairTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'viros_website',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Repairing and analyzing tables...');

        const tables = ['services', 'products', 'hero_slides', 'clients', 'partners', 'testimonials', 'users'];
        
        for (const table of tables) {
            console.log(`Analyzing ${table}...`);
            await connection.query(`ANALYZE TABLE ${table}`);
            console.log(`Checking ${table}...`);
            await connection.query(`CHECK TABLE ${table}`);
        }

        console.log('✅ All tables repaired and analyzed!');
    } catch (error) {
        console.error('❌ Error repairing tables:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

repairTables();
