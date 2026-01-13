-- Migration: Create Certificates Table
-- Date: 2026-01-13
-- Description: Creates certificates table for managing awards and certifications

USE viros_web_new;

CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    year VARCHAR(10) NOT NULL,
    image_url VARCHAR(1024),
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed with existing certificate data
INSERT INTO certificates (title, issuer, year, image_url, description, display_order, is_active) VALUES
('ISO 9001:2015 Certification', 'International Organization for Standardization', '2023', 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80', 'Certified for Quality Management Systems in hardware distribution and service.', 1, TRUE),
('Zebra Premier Business Partner', 'Zebra Technologies', '2022', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80', 'Recognized as a top-tier partner for delivering excellence in Zebra solutions.', 2, TRUE),
('Honeywell Platinum Partner', 'Honeywell', '2023', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', 'Awarded for outstanding performance in industrial automation and safety solutions.', 3, TRUE),
('Excellence in Customer Service', 'Industry Awards 2023', '2023', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', 'Voted best-in-class for client support and technical assistance.', 4, TRUE),
('Sustainability Leadership Award', 'Green Tech Initiative', '2022', 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?auto=format&fit=crop&w=800&q=80', 'Honored for commitment to eco-friendly practices in hardware lifecycle management.', 5, TRUE);

SELECT 'Certificates table created and seeded successfully!' AS status;
