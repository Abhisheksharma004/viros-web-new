const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../src/.env.local') });

async function init() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('Initializing database schema...');

        // 1. Create Services Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                status ENUM('Active', 'Inactive') DEFAULT 'Active',
                description TEXT,
                long_description TEXT,
                image_url VARCHAR(1024),
                icon_name VARCHAR(100),
                gradient VARCHAR(255),
                process JSON,
                faqs JSON,
                brands JSON,
                products JSON,
                useCases JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Services table created/checked.');

        // 2. Create Products Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT,
                tagline VARCHAR(255),
                image_url VARCHAR(1024),
                theme_color VARCHAR(255) DEFAULT 'from-[#06124f] to-[#06b6d4]',
                specs JSON,
                is_featured BOOLEAN DEFAULT FALSE,
                price_display VARCHAR(100),
                stock_status ENUM('In Stock', 'Low Stock', 'Out of Stock') DEFAULT 'In Stock',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Products table created/checked.');

        console.log('Database initialization successful!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

init();
