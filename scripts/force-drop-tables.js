const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function forceDropTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'viros_web_new',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Force dropping all tables...');

        // Disable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = ['services', 'products', 'hero_slides', 'clients', 'partners', 'testimonials', 'users'];
        
        for (const table of tables) {
            try {
                console.log(`Dropping ${table}...`);
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
                console.log(`✓ Dropped ${table}`);
            } catch (error) {
                console.log(`⚠️  Error dropping ${table}:`, error.message);
            }
        }

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n✅ All tables dropped successfully!');
        console.log('Now run: node scripts/init-all-tables.js');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

forceDropTables();
