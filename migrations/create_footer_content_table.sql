
CREATE TABLE IF NOT EXISTS footer_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    copyright_text VARCHAR(255) DEFAULT 'VIROS Entrepreneurs. All rights reserved.',
    developer_text VARCHAR(255) DEFAULT 'Developed and maintained by Viros Software Team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO footer_content (id, description, copyright_text, developer_text)
VALUES (1, 'Empowering businesses with cutting-edge AIDC solutions. From barcode printers to enterprise mobility, we deliver efficiency and reliability.', 'VIROS Entrepreneurs. All rights reserved.', 'Developed and maintained by Viros Software Team');
