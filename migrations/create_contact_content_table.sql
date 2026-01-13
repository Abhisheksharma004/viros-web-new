
-- Table for storing contact page content
CREATE TABLE IF NOT EXISTS contact_page_content (
    id INT PRIMARY KEY DEFAULT 1,
    
    -- Hero Section
    hero_title VARCHAR(255) DEFAULT 'Let''s Start a Conversation',
    hero_description TEXT,

    -- General Contact Info
    general_phone VARCHAR(255),
    general_email_support VARCHAR(255),
    general_email_info VARCHAR(255),
    address TEXT,
    
    -- Social Media
    social_twitter VARCHAR(255),
    social_linkedin VARCHAR(255),
    social_facebook VARCHAR(255),
    social_instagram VARCHAR(255),
    social_youtube VARCHAR(255),

    -- Departments
    sales_email_1 VARCHAR(255),
    sales_email_2 VARCHAR(255),
    sales_phone_1 VARCHAR(255),
    sales_phone_2 VARCHAR(255),
    
    tech_email VARCHAR(255),
    tech_phone VARCHAR(255),
    
    amc_email VARCHAR(255),
    amc_phone VARCHAR(255),
    
    training_email VARCHAR(255),
    training_phone VARCHAR(255),
    
    -- Customer Care Section
    care_title VARCHAR(255) DEFAULT 'Customer Care & Dispatch Related Inquiries',
    care_description TEXT,
    care_email VARCHAR(255),
    care_phone VARCHAR(255),
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize with default values (using ON DUPLICATE KEY UPDATE to ensure ID 1 exists)
INSERT INTO contact_page_content (
    id, 
    hero_description,
    general_phone, general_email_support, general_email_info, address,
    sales_email_1, sales_email_2, sales_phone_1, sales_phone_2,
    tech_email, tech_phone,
    amc_email, amc_phone,
    training_email, training_phone,
    care_description, care_email, care_phone,
    social_twitter, social_linkedin, social_facebook, social_instagram, social_youtube
)
VALUES (
    1,
    'Have a question about our products or services? We''re here to help you find the perfect solution for your business.',
    '+91 98765 43210', 'support@viros-entrepreneurs.com', 'info@viros-entrepreneurs.com', '123 Tech Park, IT Zone\nMumbai, Maharashtra\nIndia - 400001',
    'sales@virosentrepreneurs.com', 'marketing@virosentrepreneurs.com', '+91-987102-9141', '+91-987102-9142',
    'it@virosentrepreneurs.com', '+91-837792-9141',
    'info@virosentrepreneurs.com', '+91-730377-9141',
    'helpdesk@virosentrepreneurs.com', '+91-874383-9141',
    'We are committed to providing the best experience. If your query includes dispatch issues or hasn''t been resolved, please contact our dedicated team.', 
    'customercare@virosentrepreneurs.com', '+91-987102-9141',
    '#', '#', '#', '#', '#'
) ON DUPLICATE KEY UPDATE id=1;
