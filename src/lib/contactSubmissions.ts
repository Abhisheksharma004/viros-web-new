import pool from "@/lib/db";

export async function ensureContactSubmissionsTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            company VARCHAR(255) DEFAULT NULL,
            subject VARCHAR(255) DEFAULT 'General Inquiry',
            product VARCHAR(255) DEFAULT NULL,
            category VARCHAR(255) DEFAULT NULL,
            message TEXT NOT NULL,
            source VARCHAR(100) DEFAULT 'website_popup',
            status VARCHAR(50) DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(createTableQuery);

    // Safely ensure new columns exist if table was previously created
    try {
        await pool.query(`ALTER TABLE contact_submissions ADD COLUMN product VARCHAR(255) DEFAULT NULL AFTER subject;`);
    } catch {
        // Column already exists, ignore
    }

    try {
        await pool.query(`ALTER TABLE contact_submissions ADD COLUMN category VARCHAR(255) DEFAULT NULL AFTER product;`);
    } catch {
        // Column already exists, ignore
    }
}

export async function saveContactSubmission(data: {
    name: string;
    email: string;
    phone: string;
    company?: string | null;
    subject?: string;
    product?: string | null;
    category?: string | null;
    message: string;
    source?: string;
}) {
    await ensureContactSubmissionsTable();

    const [result]: any = await pool.query(
        `INSERT INTO contact_submissions (name, email, phone, company, subject, product, category, message, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.name,
            data.email,
            data.phone,
            data.company || null,
            data.subject || "General Inquiry",
            data.product || null,
            data.category || null,
            data.message,
            data.source || "website_popup",
        ]
    );

    return result.insertId;
}
