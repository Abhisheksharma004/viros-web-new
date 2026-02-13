-- Add video support to hero_slides table
ALTER TABLE hero_slides 
ADD COLUMN media_type ENUM('image', 'video') DEFAULT 'image' AFTER image,
ADD COLUMN video_url VARCHAR(500) NULL AFTER media_type;
