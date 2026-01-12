const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
        database: process.env.DB_NAME || 'viros_web_new',
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    console.log('Connected to database:', process.env.DB_NAME);

    try {
        // Create Tables
        console.log('Creating tables...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS about_page_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                description TEXT,
                mission TEXT,
                vision TEXT,
                video_url VARCHAR(1024),
                cta_title VARCHAR(255),
                cta_subtitle TEXT,
                cta_primary_text VARCHAR(100),
                cta_secondary_text VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS about_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                label VARCHAR(255) NOT NULL,
                value VARCHAR(100) NOT NULL,
                icon TEXT,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS about_values (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon TEXT,
                gradient VARCHAR(255),
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS about_milestones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                year VARCHAR(20) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS team_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL,
                image VARCHAR(1024),
                bio TEXT,
                linkedin VARCHAR(1024),
                instagram VARCHAR(1024),
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS about_features (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon TEXT,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('Tables created successfully.');

        // Seed Data
        console.log('Seeding data...');

        // 1. About Page Content
        const [aboutRows] = await connection.query('SELECT id FROM about_page_content LIMIT 1');
        if (aboutRows.length === 0) {
            await connection.query(`
                INSERT INTO about_page_content (title, subtitle, description, mission, vision, cta_title, cta_subtitle, cta_primary_text, cta_secondary_text) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    "About VIROS Entrepreneurs",
                    "Complete Barcode Solutions Provider",
                    "VIROS Entrepreneurs specializes in providing comprehensive barcode solutions including label printers, handheld scanners, mobile devices, and custom software solutions for modern business operations.",
                    "We specialize in providing comprehensive barcode solutions that streamline business operations across industries. From thermal label printers to mobile scanning devices, we deliver professional-grade equipment and software solutions.",
                    "To be India's most trusted barcode solutions provider, delivering innovative technology and exceptional service that enables businesses to achieve operational excellence and competitive advantage.",
                    "Ready to Optimize Your Operations?",
                    "Get premium barcode labels, thermal ribbons, and professional printer services to streamline your business operations with VIROS Entrepreneurs.",
                    "Get Quote for Labels",
                    "View Products"
                ]
            );
        }

        // 2. Stats
        const [statsRows] = await connection.query('SELECT id FROM about_stats LIMIT 1');
        if (statsRows.length === 0) {
            const stats = [
                ["Happy Clients", "500+", "Users", 0],
                ["Projects Delivered", "1000+", "Rocket", 1],
                ["Cities Served", "50+", "Target", 2],
                ["Uptime Guarantee", "99.9%", "Shield", 3]
            ];
            await connection.query('INSERT INTO about_stats (label, value, icon, display_order) VALUES ?', [stats]);
        }

        // 3. Values
        const [valuesRows] = await connection.query('SELECT id FROM about_values LIMIT 1');
        if (valuesRows.length === 0) {
            const values = [
                ["Quality Excellence", "We provide professional-grade barcode equipment and solutions with superior performance and reliability.", "💡", "from-[#06b6d4] to-[#06124f]", 0],
                ["Technical Expertise", "Our team brings deep technical knowledge in barcode technology and system integration.", "⭐", "from-[#06124f] to-[#06b6d4]", 1],
                ["Customer Success", "We build lasting partnerships with our clients, ensuring operational efficiency.", "🎯", "from-[#06b6d4] via-[#06124f] to-[#06b6d4]", 2],
                ["Innovation Focus", "We stay at the forefront of barcode technology, offering the latest solutions.", "🚀", "from-[#06124f] via-[#06b6d4] to-[#06124f]", 3]
            ];
            await connection.query('INSERT INTO about_values (title, description, icon, gradient, display_order) VALUES ?', [values]);
        }

        // 4. Milestones
        const [milestonesRows] = await connection.query('SELECT id FROM about_milestones LIMIT 1');
        if (milestonesRows.length === 0) {
            const milestones = [
                ["2018", "Inception", "VIROS Entrepreneurs was founded with a vision to simplify barcode solutions.", 0],
                ["2019", "Strategic Partnerships", "Secured key partnerships with major printer manufacturers.", 1],
                ["2021", "National Expansion", "Expanded operations to serve clients across 20+ states in India.", 2],
                ["2023", "Innovation & Software", "Launched our custom software development wing.", 3],
                ["2024", "Market Leadership", "Recognized as a top barcode solutions provider.", 4]
            ];
            await connection.query('INSERT INTO about_milestones (year, title, description, display_order) VALUES ?', [milestones]);
        }

        // 5. Team
        const [teamRows] = await connection.query('SELECT id FROM team_members LIMIT 1');
        if (teamRows.length === 0) {
            const team = [
                ["Alex Johnson", "CEO & Founder", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", "Visionary leader with 15+ years in barcode technology.", "#", "#", 0],
                ["Sarah Chen", "CTO", "https://images.unsplash.com/photo-1494790108755-2616b612b786", "Technology expert specializing in thermal printing.", "#", "#", 1],
                ["Michael Rodriguez", "Head of Strategy", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e", "Strategic consultant with expertise in barcode implementation.", "#", "#", 2]
            ];
            await connection.query('INSERT INTO team_members (name, role, image, bio, linkedin, instagram, display_order) VALUES ?', [team]);
        }

        // 6. Features
        const [featuresRows] = await connection.query('SELECT id FROM about_features LIMIT 1');
        if (featuresRows.length === 0) {
            const features = [
                ["Label Printers", "Professional-grade thermal and direct thermal barcode label printers.", "🖨️", 0],
                ["Handheld Scanners", "High-performance handheld barcode scanners with advanced reading capabilities.", "🔍", 1],
                ["Mobile TABs & Devices", "Rugged Android mobile computers and tablets with integrated barcode scanning.", "📱", 2],
                ["Labels & Ribbons", "Complete range of high-quality barcode labels and thermal transfer ribbons.", "🏷️", 3]
            ];
            await connection.query('INSERT INTO about_features (title, description, icon, display_order) VALUES ?', [features]);
        }

        console.log('Data seeded successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
