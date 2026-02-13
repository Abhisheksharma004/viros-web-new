-- Create table to track birthday email history
CREATE TABLE IF NOT EXISTS birthday_email_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    birthday_id INT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'sent',
    message_id VARCHAR(500),
    error_message TEXT,
    celebration_time VARCHAR(50),
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE,
    INDEX idx_birthday_id (birthday_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
