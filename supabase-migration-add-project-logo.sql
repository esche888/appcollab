-- Migration: Add logo_url to projects table
-- Description: Adds a logo_url field to store project logo image URLs
-- Date: 2024-12-24

-- Add logo_url column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.logo_url IS 'URL to the project logo image';
