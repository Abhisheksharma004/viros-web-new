const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../src/.env.local') });

const testimonials = [
    {
        name: "Rajesh Kumar",
        role: "Operations Manager",
        company: "Reliance Retail",
        content: "VIROS has transformed our inventory management. The barcode scanners are durable and the integration was seamless.",
        rating: 5,
        status: "Approved",
        display_order: 0
    },
    {
        name: "Anita Desai",
        role: "Logistics Head",
        company: "Blue Dart",
        content: "The handheld devices provided by VIROS have significantly improved our delivery tracking efficiency. Highly recommended!",
        rating: 5,
        status: "Approved",
        display_order: 1
    },
    {
        name: "Vikram Singh",
        role: "IT Director",
        company: "Tata Croma",
        content: "Excellent support and top-notch hardware. Their team understood our specific requirements and delivered perfect solutions.",
        rating: 5,
        status: "Approved",
        display_order: 2
    },
    {
        name: "Sneha Patel",
        role: "Supply Chain Lead",
        company: "Flipkart",
        content: "Reliable equipment is crucial for our warehouses. VIROS delivers consistently high-quality barcode printers and scanners.",
        rating: 5,
        status: "Approved",
        display_order: 3
    },
    {
        name: "Amit Shah",
        role: "Store Manager",
        company: "D-Mart",
        content: "We use VIROS products across multiple stores. The durability and ease of use are unmatched in the market.",
        rating: 5,
        status: "Approved",
        display_order: 4
    }
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
        console.log('Migrating testimonials...');
        for (const t of testimonials) {
            await connection.query(
                'INSERT INTO testimonials (name, role, company, content, rating, status, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [t.name, t.role, t.company, t.content, t.rating, t.status, t.display_order]
            );
        }
        console.log('Testimonials migrated successfully.');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await connection.end();
    }
}

migrate();
