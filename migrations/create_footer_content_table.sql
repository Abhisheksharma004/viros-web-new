
CREATE TABLE IF NOT EXISTS footer_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    copyright_text VARCHAR(255) DEFAULT 'VIROS Entrepreneurs. All rights reserved.',
    developer_text VARCHAR(255) DEFAULT 'Developed and maintained by Viros Software Team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
