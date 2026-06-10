-- Migration: WhatsApp Tracking Flags
-- Adds boolean flags to orders to prevent duplicate message sends

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS wa_shipping_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wa_delivered_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wa_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wa_shipping_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wa_delivered_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wa_reminder_sent_at TIMESTAMP WITH TIME ZONE;
