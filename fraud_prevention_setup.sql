-- Fraud Prevention Update for Orders Table

-- Add print tracking columns to prevent double-printing without audit trail
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS print_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_printed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_printed_by VARCHAR(255);
