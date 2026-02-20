-- Create services_page_content table for managing services page content

CREATE TABLE IF NOT EXISTS services_page_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Hero Section
    hero_badge VARCHAR(100) DEFAULT 'Our Expertise',
    hero_title TEXT,
    hero_description TEXT,
    
    -- Process Section
    process_badge VARCHAR(100) DEFAULT 'Our Process',
    process_title VARCHAR(255) DEFAULT 'How We Deliver Excellence',
    process_description TEXT,
    process_steps JSON DEFAULT NULL,
    
    -- CTA Section
    cta_title TEXT,
    cta_description TEXT,
    cta_primary_button VARCHAR(100) DEFAULT 'Get a Custom Quote',
    cta_secondary_button VARCHAR(100) DEFAULT 'Contact Our Team',
    
    -- Inquiry Popup Content
    inquiry_product_name VARCHAR(255) DEFAULT 'AIDC & IT Solutions',
    inquiry_product_category VARCHAR(100) DEFAULT 'Services',
    inquiry_product_description TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default content
INSERT INTO services_page_content (
    hero_badge,
    hero_title,
    hero_description,
    process_badge,
    process_title,
    process_description,
    process_steps,
    cta_title,
    cta_description,
    cta_primary_button,
    cta_secondary_button,
    inquiry_product_name,
    inquiry_product_category,
    inquiry_product_description
) VALUES (
    'Our Expertise',
    'We Provide Complete AIDC, IT Hardware & Software Solutions',
    'We provide end-to-end solutions for all your identification and tracking needs, helping you achieve operational excellence.',
    'Our Process',
    'How We Deliver Excellence',
    'Our proven methodology ensures that every solution is perfectly tailored to your business needs.',
    '[
        {
            "step": "01",
            "title": "Consultation",
            "description": "We analyze your business requirements and operational workflows to identify the ideal barcode solution."
        },
        {
            "step": "02",
            "title": "Solution Design",
            "description": "Our experts design a tailored solution integrating the right hardware and software components."
        },
        {
            "step": "03",
            "title": "Implementation",
            "description": "Seamless installation and setup of equipment with comprehensive staff training."
        },
        {
            "step": "04",
            "title": "Support",
            "description": "Ongoing technical support and maintenance ensuring maximum uptime for your operations."
        }
    ]',
    'Ready to Transform Your Business?',
    'Contact us today for a free consultation and discover how our barcode solutions can optimize your operations.',
    'Get a Custom Quote',
    'Contact Our Team',
    'AIDC & IT Solutions',
    'Services',
    'Get a customized quote for our complete AIDC, IT Hardware & Software solutions tailored to your business needs.'
);
