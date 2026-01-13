const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function init() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'viros_website',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Initializing all database tables...');

        // Create Services Table
        console.log('Creating services table...');
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
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4
        `);

        // Create Products Table
        console.log('Creating products table...');
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
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4
        `);

        // Create Hero Slides Table
        console.log('Creating hero_slides table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS hero_slides (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                image VARCHAR(1024) NOT NULL,
                cta VARCHAR(255) DEFAULT 'Browse Products',
                cta_secondary VARCHAR(255) DEFAULT 'Get Quote',
                display_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4
        `);

        // Create Clients Table
        console.log('Creating clients table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                logo_url VARCHAR(1024) NOT NULL,
                display_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4
        `);

        // Create Partners Table
        console.log('Creating partners table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS partners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                logo_url VARCHAR(1024) NOT NULL,
                category VARCHAR(100),
                display_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4
        `);

        // Create Testimonials Table
        console.log('Creating testimonials table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS testimonials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                company VARCHAR(255),
                content TEXT NOT NULL,
                rating INT DEFAULT 5,
                status ENUM('Pending', 'Approved') DEFAULT 'Pending',
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4
        `);

        console.log('✅ All database tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

init();
