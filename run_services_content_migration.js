const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'viros_web_new',
            port: parseInt(process.env.DB_PORT || '3307'),
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', 'create_services_page_content_table.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        console.log('📄 Running migration: create_services_page_content_table.sql');

        // Execute the migration
        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('📊 Services Page Content Table Structure:');
        console.log('   - hero_badge, hero_title, hero_description');
        console.log('   - process_badge, process_title, process_description, process_steps (JSON)');
        console.log('   - cta_title, cta_description, cta_primary_button, cta_secondary_button');
        console.log('   - inquiry_product_name, inquiry_product_category, inquiry_product_description');
        console.log('');
        console.log('✨ Default content has been inserted!');
        console.log('');
        console.log('🔧 Next steps:');
        console.log('   1. Update src/app/services/page.tsx to fetch content from API');
        console.log('   2. Create dashboard page to manage services page content');
        console.log('   3. Access API at: /api/services/content');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  Table already exists. Skipping creation.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('❌ Could not connect to MySQL. Please ensure MySQL is running on port', process.env.DB_PORT || '3307');
        } else {
            console.error('Error details:', error);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the migration
runMigration();
