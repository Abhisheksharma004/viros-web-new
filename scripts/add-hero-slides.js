const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function addHeroSlides() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'viros_web_new',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Adding sample hero slides...');

        const slides = [
            {
                title: 'Transform Your Business with AIDC Solutions',
                subtitle: 'Industry-Leading Technology',
                description: 'From barcode scanners to complete inventory management systems, we provide cutting-edge Auto-ID and Data Capture solutions tailored to your business needs.',
                image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                cta: 'Browse Products',
                cta_secondary: 'Get Quote',
                display_order: 1,
                is_active: true
            },
            {
                title: 'Premium Hardware Solutions',
                subtitle: 'Built for Performance',
                description: 'Industrial-grade barcode printers, scanners, and mobile computers designed for the toughest environments. Partner with industry leaders like Zebra and Honeywell.',
                image: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                cta: 'View Hardware',
                cta_secondary: 'Contact Sales',
                display_order: 2,
                is_active: true
            },
            {
                title: 'Expert Support & Services',
                subtitle: '24/7 Technical Support',
                description: 'From installation to maintenance, our certified technicians ensure your AIDC infrastructure runs smoothly. Annual Maintenance Contracts available nationwide.',
                image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                cta: 'Our Services',
                cta_secondary: 'Get Support',
                display_order: 3,
                is_active: true
            }
        ];

        for (const slide of slides) {
            await connection.query(
                `INSERT INTO hero_slides 
                (title, subtitle, description, image, cta, cta_secondary, display_order, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    slide.title,
                    slide.subtitle,
                    slide.description,
                    slide.image,
                    slide.cta,
                    slide.cta_secondary,
                    slide.display_order,
                    slide.is_active
                ]
            );
            console.log(`✓ Added: ${slide.title}`);
        }

        console.log('\n✅ All hero slides added successfully!');
        console.log('You can view them at: http://localhost:3000');
        console.log('Manage them at: http://localhost:3000/dashboard/hero\n');

    } catch (error) {
        console.error('❌ Error adding hero slides:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

addHeroSlides();
