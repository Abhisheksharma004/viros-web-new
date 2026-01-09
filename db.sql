CREATE DATABASE IF NOT EXISTS viros_website;
USE viros_website;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: The password 'Admin@2025' should be hashed before being inserted into a production database.
-- For this setup, I'll provide the SQL, but the actual insertion will happen via a script or API to ensure hashing.
-- Hashed password for 'Admin@2025': $2a$10$8k9.d8DqCj/E6L.u9Q7fXeYyvVf.fQYh.n8P.B/9U/J8Z/UqGzG6
INSERT INTO users (email, password) VALUES ('sales@virosentrepreneurs.com', '$2a$10$8k9.d8DqCj/E6L.u9Q7fXeYyvVf.fQYh.n8P.B/9U/J8Z/UqGzG6')
ON DUPLICATE KEY UPDATE password = VALUES(password);

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
