import pool from "@/lib/db";

export interface ProductOrderData {
    orderRef: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    companyName?: string | null;
    gstin?: string | null;
    productName: string;
    category?: string | null;
    quantity: number;
    unitPrice?: string | null;
    totalAmount: number;
    paymentMethod: string;
    deliveryAddress: string;
    city: string;
    pincode: string;
    state?: string | null;
    orderNotes?: string | null;
    trackingNumber?: string | null;
    trackingLink?: string | null;
    courierName?: string | null;
    otpVerified?: boolean;
    orderStatus?: "pending" | "confirmed" | "processing" | "dispatched" | "out_for_delivery" | "delivered" | "cancelled" | string;
    paymentStatus?: "unpaid" | "paid" | "cod_pending" | "refunded" | string;
}

export async function ensureProductOrdersTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS product_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_ref VARCHAR(50) NOT NULL UNIQUE,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) NOT NULL,
            company_name VARCHAR(255) DEFAULT NULL,
            gstin VARCHAR(50) DEFAULT NULL,
            product_name VARCHAR(255) NOT NULL,
            category VARCHAR(255) DEFAULT NULL,
            quantity INT DEFAULT 1,
            unit_price VARCHAR(100) DEFAULT NULL,
            total_amount DECIMAL(12,2) DEFAULT 0.00,
            payment_method VARCHAR(50) DEFAULT 'COD',
            delivery_address TEXT NOT NULL,
            city VARCHAR(100) NOT NULL,
            pincode VARCHAR(20) NOT NULL,
            state VARCHAR(100) DEFAULT NULL,
            order_notes TEXT DEFAULT NULL,
            tracking_number VARCHAR(100) DEFAULT NULL,
            tracking_link VARCHAR(500) DEFAULT NULL,
            courier_name VARCHAR(100) DEFAULT NULL,
            otp_verified BOOLEAN DEFAULT TRUE,
            order_status VARCHAR(50) DEFAULT 'confirmed',
            payment_status VARCHAR(50) DEFAULT 'cod_pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_order_ref (order_ref),
            INDEX idx_customer_email (customer_email),
            INDEX idx_order_status (order_status),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(createTableQuery);

    // Safely ensure new columns exist if table was previously created
    try {
        await pool.query(`ALTER TABLE product_orders ADD COLUMN tracking_number VARCHAR(100) DEFAULT NULL AFTER order_notes;`);
    } catch {}

    try {
        await pool.query(`ALTER TABLE product_orders ADD COLUMN tracking_link VARCHAR(500) DEFAULT NULL AFTER tracking_number;`);
    } catch {}

    try {
        await pool.query(`ALTER TABLE product_orders ADD COLUMN courier_name VARCHAR(100) DEFAULT NULL AFTER tracking_link;`);
    } catch {}
}

export async function saveProductOrder(data: ProductOrderData) {
    await ensureProductOrdersTable();

    const insertQuery = `
        INSERT INTO product_orders (
            order_ref,
            customer_name,
            customer_email,
            customer_phone,
            company_name,
            gstin,
            product_name,
            category,
            quantity,
            unit_price,
            total_amount,
            payment_method,
            delivery_address,
            city,
            pincode,
            state,
            order_notes,
            tracking_number,
            tracking_link,
            courier_name,
            otp_verified,
            order_status,
            payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.orderRef,
        data.customerName,
        data.customerEmail,
        data.customerPhone,
        data.companyName || null,
        data.gstin || null,
        data.productName,
        data.category || null,
        data.quantity || 1,
        data.unitPrice || null,
        data.totalAmount || 0,
        data.paymentMethod || "COD",
        data.deliveryAddress,
        data.city,
        data.pincode,
        data.state || null,
        data.orderNotes || null,
        data.trackingNumber || null,
        data.trackingLink || null,
        data.courierName || null,
        data.otpVerified !== false,
        data.orderStatus || "confirmed",
        data.paymentStatus || (data.paymentMethod === "online" ? "paid" : "cod_pending"),
    ];

    const [result]: any = await pool.query(insertQuery, values);
    return result.insertId;
}

export async function getAllProductOrders(options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    await ensureProductOrdersTable();

    let query = `SELECT * FROM product_orders WHERE 1=1`;
    const params: any[] = [];

    if (options?.status && options.status !== "all") {
        query += ` AND order_status = ?`;
        params.push(options.status);
    }

    if (options?.search) {
        query += ` AND (order_ref LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR product_name LIKE ? OR tracking_number LIKE ? OR courier_name LIKE ?)`;
        const s = `%${options.search}%`;
        params.push(s, s, s, s, s, s, s);
    }

    query += ` ORDER BY created_at DESC`;

    if (options?.limit) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(options.limit, options.offset || 0);
    }

    const [rows]: any = await pool.query(query, params);
    return rows;
}
