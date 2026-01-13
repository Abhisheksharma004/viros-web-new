
CREATE TABLE IF NOT EXISTS legal_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    privacy_policy LONGTEXT,
    terms_of_service LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO legal_content (privacy_policy, terms_of_service)
SELECT '', ''
WHERE NOT EXISTS (SELECT * FROM legal_content);
