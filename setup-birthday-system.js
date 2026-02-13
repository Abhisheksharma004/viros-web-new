/**
 * Complete Birthday Email System Setup
 * 
 * This script sets up everything needed for the enhanced birthday email system:
 * 1. Creates birthdays table (if not exists)
 * 2. Creates birthday_email_history table
 * 
 * Usage:
 * node setup-birthday-system.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🎂 Birthday Email System Setup');
        console.log('═'.repeat(50));
        
        // Create database connection
        console.log('\n📡 Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'viros_web_new',
            port: parseInt(process.env.DB_PORT || '3306')
        });
        console.log('✅ Connected to database');

        // Check if birthdays table exists
        console.log('\n🔍 Checking birthdays table...');
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'birthdays'"
        );
        
        if (tables.length === 0) {
            console.log('📝 Creating birthdays table...');
            const birthdayTableSQL = `
CREATE TABLE birthdays (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_birthdays_date (date),
  KEY idx_birthdays_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;
            await connection.query(birthdayTableSQL);
            console.log('✅ Birthdays table created');
        } else {
            console.log('✅ Birthdays table already exists');
        }

        // Check if birthday_email_history table exists
        console.log('\n🔍 Checking birthday_email_history table...');
        const [historyTables] = await connection.query(
            "SHOW TABLES LIKE 'birthday_email_history'"
        );
        
        if (historyTables.length === 0) {
            console.log('📝 Creating birthday_email_history table...');
            const migrationPath = path.join(__dirname, 'migrations', 'create_birthday_email_history_table.sql');
            const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
            await connection.query(migrationSQL);
            console.log('✅ Birthday email history table created');
        } else {
            console.log('✅ Birthday email history table already exists');
        }

        // Verify tables
        console.log('\n🔍 Verifying setup...');
        const [allTables] = await connection.query(`
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('birthdays', 'birthday_email_history')
        `, [process.env.DB_NAME || 'viros_web_new']);
        
        console.log('\n📊 Database Tables:');
        allTables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS} rows`);
        });

        console.log('\n' + '═'.repeat(50));
        console.log('🎉 Setup Complete!');
        console.log('\n✅ Your birthday email system is ready to use!');
        console.log('\n📝 Next Steps:');
        console.log('1. Configure SMTP settings in .env.local');
        console.log('2. Open dashboard at /dashboard/birthday-remainder');
        console.log('3. Add birthdays');
        console.log('4. Test preview & send features');
        console.log('5. Setup cron job for automation');
        console.log('\n📚 Documentation:');
        console.log('- BIRTHDAY_EMAIL_ENHANCED.md - Complete guide');
        console.log('- IMPLEMENTATION_SUMMARY.md - Feature overview');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Database connection refused. Please check:');
            console.error('1. MySQL/MariaDB is running');
            console.error('2. Database credentials in .env.local are correct');
            console.error('3. Database exists');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Access denied. Please check:');
            console.error('1. DB_USER has proper permissions');
            console.error('2. DB_PASSWORD is correct');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// ASCII art header
console.clear();
console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🎂 Birthday Email System Setup 🎂              ║
║                                                   ║
║   Enhanced with:                                  ║
║   • Email Validation ✅                          ║
║   • History Tracking 📝                          ║
║   • Email Preview 👁️                             ║
║   • Automation Support ⏰                        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
`);

setupDatabase();
