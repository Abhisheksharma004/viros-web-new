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
        console.log('🎬 Starting hero slides video support migration...\n');

        const migrationSQL = await fs.readFile(
            path.join(__dirname, 'migrations', 'add_video_to_hero_slides.sql'),
            'utf-8'
        );

        await connection.query(migrationSQL);
        console.log('✅ Hero slides table updated with video support!\n');

        // Verify columns were added
        const [columns] = await connection.query('DESCRIBE hero_slides');
        console.log('📋 Updated table structure:');
        console.table(columns);

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
        console.log('💡 You can now add YouTube videos to hero slides!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
