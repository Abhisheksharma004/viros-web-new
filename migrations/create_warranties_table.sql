-- Migration: Create Warranties Table
-- Date: 2026-01-13
-- Description: Creates warranties table for managing product warranties

USE viros_web_new;

CREATE TABLE IF NOT EXISTS warranties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    status ENUM('active', 'expired') NOT NULL DEFAULT 'active',
    warranty_type VARCHAR(100) NOT NULL,
    purchase_date DATE,
    expiry_date DATE NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_serial (serial_number),
    INDEX idx_status (status)
);

-- Seed with existing mock warranty data
INSERT INTO warranties (serial_number, product_name, status, warranty_type, expiry_date, is_active) VALUES
('SN-VIROS-001', 'VIROS Handheld Scanner X1', 'active', 'Standard Warranty', '2026-12-31', TRUE),
('SN-VIROS-002', 'Thermal Printer T-500', 'expired', 'Standard Warranty', '2024-01-15', TRUE),
('SN-VIROS-003', 'Industrial Tablet Pro', 'active', 'Extended Coverage', '2027-11-20', TRUE);

SELECT 'Warranties table created and seeded successfully!' AS status;
