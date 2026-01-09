const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../src/.env.local') });

const partners = [
    { name: "Honeywell", logo: "https://logos-world.net/wp-content/uploads/2021/02/Honeywell-Emblem.png", category: "Hardware" },
    { name: "Zebra Technologies", logo: "https://logowik.com/content/uploads/images/zebra-technologies2902.jpg", category: "Hardware" },
    { name: "TSC Printers", logo: "https://www.tscprinters.com/media/wysiwyg/TSC_logo.png", category: "Hardware" },
    { name: "Sato", logo: "https://www.satoeurope.com/wp-content/uploads/2020/03/sato-logo.png", category: "Hardware" },
];

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('Migrating partners...');
        for (let i = 0; i < partners.length; i++) {
            const partner = partners[i];
            await connection.query(
                'INSERT INTO partners (name, logo_url, category, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
                [partner.name, partner.logo, partner.category, i, true]
            );
        }
        console.log('Partners migrated successfully.');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await connection.end();
    }
}

migrate();
