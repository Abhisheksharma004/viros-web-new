const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function addHeroLinks() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
        database: process.env.DB_NAME || 'viros_web_new',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        console.log('Adding link columns to hero_slides table...');

        // Check if columns already exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'hero_slides'
        `, [process.env.DB_NAME || 'viros_web_new']);

        const existingColumns = columns.map((col) => col.COLUMN_NAME);

        // Add cta_link column if it doesn't exist
        if (!existingColumns.includes('cta_link')) {
            console.log('Adding cta_link column...');
            await connection.query(`
                ALTER TABLE hero_slides 
                ADD COLUMN cta_link VARCHAR(1024) DEFAULT '/products' AFTER cta
            `);
            console.log('✓ cta_link column added');
        } else {
            console.log('✓ cta_link column already exists');
        }

        // Add cta_secondary_link column if it doesn't exist
        if (!existingColumns.includes('cta_secondary_link')) {
            console.log('Adding cta_secondary_link column...');
            await connection.query(`
                ALTER TABLE hero_slides 
                ADD COLUMN cta_secondary_link VARCHAR(1024) DEFAULT '/contact' AFTER cta_secondary
            `);
            console.log('✓ cta_secondary_link column added');
        } else {
            console.log('✓ cta_secondary_link column already exists');
        }

        // Update existing records with default links
        console.log('Updating existing records with default links...');
        await connection.query(`
            UPDATE hero_slides 
            SET cta_link = '/products', cta_secondary_link = '/contact' 
            WHERE cta_link IS NULL OR cta_secondary_link IS NULL
        `);

        console.log('\n✅ Migration completed successfully!');
        console.log('Hero slides now support button links.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

addHeroLinks();
