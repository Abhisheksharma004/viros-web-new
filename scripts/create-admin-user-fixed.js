const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function createAdminUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'viros_web_new',
        port: process.env.DB_PORT || 3306
    });

    try {
        // First, create users table if it doesn't exist
        console.log('Ensuring users table exists...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Users table ready');

        // Admin credentials
        const adminEmail = 'sales@virosentrepreneurs.com';
        const adminPassword = 'Admin@2025';

        console.log('\nCreating admin user...');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Check if user already exists
        const [existing] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existing.length > 0) {
            console.log('\nUser already exists, updating password...');
            await connection.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, adminEmail]
            );
            console.log('✅ Admin user password updated!');
        } else {
            console.log('\nInserting new admin user...');
            await connection.query(
                'INSERT INTO users (email, password) VALUES (?, ?)',
                [adminEmail, hashedPassword]
            );
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n=== Login Credentials ===');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('=========================\n');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createAdminUser();
