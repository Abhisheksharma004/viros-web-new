const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'viros_web_new'
    });

    console.log('Migrating database...');

    try {
        const columns = [
            ['home_about_badge', "VARCHAR(100) DEFAULT 'WHO WE ARE'"],
            ['home_about_title', "VARCHAR(255) DEFAULT 'Complete Barcode Solutions Provider'"],
            ['home_about_description', 'TEXT'],
            ['home_about_image', 'VARCHAR(1024)'],
            ['home_about_card_title', "VARCHAR(255) DEFAULT 'Trusted Partner'"],
            ['home_about_card_subtitle', "VARCHAR(255) DEFAULT 'Helping businesses scale since 2018'"]
        ];

        for (const [col, type] of columns) {
            const [check] = await connection.execute(
                `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                 WHERE TABLE_SCHEMA = 'viros_web_new' 
                 AND TABLE_NAME = 'about_page_content' 
                 AND COLUMN_NAME = ?`,
                [col]
            );

            if (check[0].count === 0) {
                console.log(`Adding column ${col}...`);
                await connection.execute(`ALTER TABLE about_page_content ADD COLUMN ${col} ${type}`);
            } else {
                console.log(`Column ${col} already exists.`);
            }
        }

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
