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
        // Admin credentials
        const adminEmail = process.env.ADMIN_EMAIL || 'sales@virosentrepreneurs.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Viros@2025';
        const adminName = process.env.ADMIN_NAME || 'Administrator';

        await connection.query(
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL AFTER email`
        ).catch(() => {
            // MySQL < 8.0: ignore IF NOT EXISTS; column may already exist
        });

        console.log('Creating admin user...');
        console.log('Email:', adminEmail);
        console.log('Name:', adminName);
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
                'UPDATE users SET password = ?, name = ? WHERE email = ?',
                [hashedPassword, adminName, adminEmail]
            );
            console.log('✅ Admin user password updated!');
        } else {
            console.log('\nInserting new admin user...');
            await connection.query(
                'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
                [adminEmail, adminName, hashedPassword]
            );
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n==============================================');
        console.log('Admin Login Credentials:');
        console.log('==============================================');
        console.log('Email:', adminEmail);
        console.log('Name:', adminName);
        console.log('Password:', adminPassword);
        console.log('Login URL: http://localhost:3000/admin-login');
        console.log('==============================================\n');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createAdminUser();
