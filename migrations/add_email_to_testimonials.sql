-- Add email column to testimonials table
ALTER TABLE testimonials 
ADD COLUMN email VARCHAR(255) AFTER name;
