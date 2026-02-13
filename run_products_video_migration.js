const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    console.log('🎬 Starting products video support migration...\n');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        // Read and execute migration
        const migration = `
            ALTER TABLE products 
            ADD COLUMN media_type ENUM('image', 'video') DEFAULT 'image' AFTER image_url,
            ADD COLUMN video_url VARCHAR(500) NULL AFTER media_type;
        `;

        await connection.query(migration);
        console.log('✅ Products table updated with video support!\n');

        // Show updated table structure
        const [columns] = await connection.query('DESCRIBE products');
        console.log('📋 Updated table structure:');
        console.table(columns);

        console.log('\n✅ Migration completed successfully!');
        console.log('💡 You can now add YouTube videos to products!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
