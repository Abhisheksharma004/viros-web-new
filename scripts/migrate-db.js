const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: 'viros_web_new',
    port: parseInt(process.env.DB_PORT || '3306')
};

async function migrate() {
    console.log('Connecting to database: viros_web_new');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // Rename about_values if it exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'about_values'");
        if (tables.length > 0) {
            console.log("Renaming about_values to about_core_values...");
            await connection.query("RENAME TABLE about_values TO about_core_values");
            console.log("Renamed successfully.");
        }

        // Ensure all required tables exist
        const queries = [
            `CREATE TABLE IF NOT EXISTS about_core_values (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon TEXT,
        gradient VARCHAR(255),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS about_page_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) DEFAULT 'Complete Barcode Solutions Provider',
        subtitle VARCHAR(255) DEFAULT 'About VIROS Entrepreneurs',
        description TEXT,
        mission TEXT,
        vision TEXT,
        video_url VARCHAR(255),
        cta_title VARCHAR(255) DEFAULT 'Ready to Optimize Your Operations?',
        cta_subtitle TEXT,
        cta_primary_text VARCHAR(100) DEFAULT 'Get Quote for Labels',
        cta_secondary_text VARCHAR(100) DEFAULT 'View Products',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS about_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        icon VARCHAR(255),
        value VARCHAR(50),
        label VARCHAR(100),
        sort_order INT DEFAULT 0
      )`,
            `CREATE TABLE IF NOT EXISTS about_features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        icon VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        sort_order INT DEFAULT 0
      )`,
            `CREATE TABLE IF NOT EXISTS about_milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year VARCHAR(10),
        title VARCHAR(255),
        description TEXT,
        icon TEXT,
        sort_order INT DEFAULT 0
      )`
        ];

        for (const query of queries) {
            await connection.query(query);
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        if (connection) await connection.end();
    }
}
migrate();
