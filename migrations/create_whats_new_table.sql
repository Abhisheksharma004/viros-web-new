CREATE TABLE IF NOT EXISTS whats_new_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(50) NOT NULL,
    tag_color VARCHAR(20) NOT NULL DEFAULT '#0a2a5e',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    link VARCHAR(255) NOT NULL DEFAULT '/contact',
    link_text VARCHAR(100) NOT NULL DEFAULT 'Learn More',
    is_new TINYINT(1) NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO whats_new_items (tag, tag_color, title, description, link, link_text, is_new, is_active, display_order) VALUES
('PRODUCT LAUNCH', '#0a2a5e', 'New Industrial Barcode Printer Series Launched', 'Introducing our latest high-speed industrial barcode printers with enhanced durability and performance.', '/products', 'View Products', 1, 1, 1),
('EVENT', '#2a9d8f', 'VIROS at Logicon Expo 2026', 'Meet us at the upcoming Logicon Expo — Booth #204. Discover our latest AIDC solutions live.', '/contact', 'Book a Meeting', 0, 1, 2);
