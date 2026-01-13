
-- Table for storing dynamic departments
CREATE TABLE IF NOT EXISTS contact_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    email_1 VARCHAR(255),
    email_2 VARCHAR(255),
    phone_1 VARCHAR(255),
    phone_2 VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default departments (migrating from the hardcoded structure)
INSERT INTO contact_departments (title, description, email_1, email_2, phone_1, phone_2) VALUES 
('Sales Department', 'Product inquiries, quotes, and new business', 'sales@virosentrepreneurs.com', 'marketing@virosentrepreneurs.com', '+91-987102-9141', '+91-987102-9142'),
('Technical Support', '24/7 support for existing customers', 'it@virosentrepreneurs.com', NULL, '+91-837792-9141', NULL),
('AMC Services', 'Annual maintenance contracts and servicing', 'info@virosentrepreneurs.com', NULL, '+91-730377-9141', NULL),
('Training Center', 'Product training and certification programs', 'helpdesk@virosentrepreneurs.com', NULL, '+91-874383-9141', NULL);
