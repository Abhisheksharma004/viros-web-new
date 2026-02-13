-- Add video support to products table
-- This migration adds media_type and video_url columns to enable YouTube video support

ALTER TABLE products 
ADD COLUMN media_type ENUM('image', 'video') DEFAULT 'image' AFTER image_url,
ADD COLUMN video_url VARCHAR(500) NULL AFTER media_type;
