-- Create birthdays table for birthday reminders
CREATE TABLE IF NOT EXISTS birthdays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index on date for faster queries
CREATE INDEX idx_birthdays_date ON birthdays(date);

-- Create index on is_active for filtering active reminders
CREATE INDEX idx_birthdays_active ON birthdays(is_active);
