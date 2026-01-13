-- Migration: Remove notes column from warranties table
-- Date: 2026-01-13
-- Description: Removes the notes field from warranties table

USE viros_web_new;

ALTER TABLE warranties DROP COLUMN notes;

SELECT 'Notes column removed successfully!' AS status;
