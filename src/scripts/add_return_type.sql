-- NINOC Database Migration
-- Add return_type to retur_requests table

ALTER TABLE retur_requests ADD COLUMN IF NOT EXISTS return_type TEXT NOT NULL DEFAULT 'refund' CHECK (return_type IN ('refund', 'exchange'));
