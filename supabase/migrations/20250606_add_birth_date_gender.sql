-- Add birth_date and gender columns to customer_profiles
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
