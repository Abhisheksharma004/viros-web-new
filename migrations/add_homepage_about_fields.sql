-- Migration: Add Homepage AboutSection Fields
-- Date: 2026-01-13
-- Description: Adds columns to about_page_content table for managing homepage AboutSection component

USE viros_web_new;

-- Add homepage-specific fields to about_page_content table
ALTER TABLE about_page_content
ADD COLUMN IF NOT EXISTS homepage_badge VARCHAR(100) DEFAULT 'WHO WE ARE',
ADD COLUMN IF NOT EXISTS homepage_title VARCHAR(255) DEFAULT 'Complete Barcode Solutions Provider',
ADD COLUMN IF NOT EXISTS homepage_description TEXT DEFAULT 'VIROS Entrepreneurs specializes in providing comprehensive barcode solutions including label printers, handheld scanners, mobile devices, and custom software solutions. We enable businesses to achieve operational excellence through innovative technology.',
ADD COLUMN IF NOT EXISTS homepage_image_url VARCHAR(1024) DEFAULT 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
ADD COLUMN IF NOT EXISTS homepage_card_title VARCHAR(100) DEFAULT 'Trusted Partner',
ADD COLUMN IF NOT EXISTS homepage_card_subtitle VARCHAR(255) DEFAULT 'Helping businesses scale since 2018';

-- Verify the changes
SELECT 'Migration completed successfully. New columns added to about_page_content table.' AS status;
