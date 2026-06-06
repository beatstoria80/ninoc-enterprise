-- Add WhatsApp notification tracking columns to orders table
-- Run in Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS wa_invoice_sent BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wa_invoice_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wa_shipping_sent BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wa_shipping_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wa_tracking_message_id TEXT;

COMMENT ON COLUMN orders.wa_invoice_sent IS 'Whether invoice WA has been sent to customer';
COMMENT ON COLUMN orders.wa_invoice_sent_at IS 'Timestamp when invoice WA was sent';
COMMENT ON COLUMN orders.wa_shipping_sent IS 'Whether shipping update WA has been sent';
COMMENT ON COLUMN orders.wa_shipping_sent_at IS 'Timestamp when shipping WA was sent';
COMMENT ON COLUMN orders.wa_tracking_message_id IS 'WhatsApp message ID for tracking notification';