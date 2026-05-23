-- Migration: Add badge_text column to products table
-- Run via: npx supabase db query --linked < this file
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_text TEXT;
