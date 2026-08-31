-- ═══════════════════════════════════════════════════════════════════
-- NINOC WhatsApp Commerce — Database Schema
-- Migration: 20260831_wa_commerce_tables.sql
--
-- Creates isolated tables for WhatsApp Commerce channel.
-- DOES NOT modify any existing tables.
-- All tables prefixed with wa_commerce_ for clear identification.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Order Sessions (Cross-Channel Handoff) ────────────────────

CREATE TABLE IF NOT EXISTS wa_commerce_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order token for Web→WhatsApp handoff
  order_token TEXT UNIQUE NOT NULL,
  
  -- Snapshot of cart at time of WA handoff
  cart_snapshot JSONB NOT NULL,
  
  -- User's WhatsApp phone number (set when they message the bot)
  user_phone TEXT,
  
  -- Shipping details (filled via WhatsApp Flow or pre-filled from web)
  shipping_address JSONB,
  
  -- Selected courier from Biteship
  selected_courier JSONB,
  
  -- Midtrans payment
  midtrans_snap_token TEXT,
  midtrans_order_id TEXT,
  
  -- Payment status
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'expired', 'cancelled', 'refunded')),
  
  -- Reference to WA message for tracking
  wa_message_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Sandbox isolation flag
  is_sandbox BOOLEAN NOT NULL DEFAULT true
);

-- Index for token lookup (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_wa_commerce_sessions_token
  ON wa_commerce_sessions (order_token);

-- Index for phone lookup (find sessions by user)
CREATE INDEX IF NOT EXISTS idx_wa_commerce_sessions_phone
  ON wa_commerce_sessions (user_phone)
  WHERE user_phone IS NOT NULL;

-- Index for cleanup (expired sessions)
CREATE INDEX IF NOT EXISTS idx_wa_commerce_sessions_expires
  ON wa_commerce_sessions (expires_at)
  WHERE payment_status = 'pending';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION wa_commerce_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wa_commerce_sessions_updated ON wa_commerce_sessions;
CREATE TRIGGER trg_wa_commerce_sessions_updated
  BEFORE UPDATE ON wa_commerce_sessions
  FOR EACH ROW EXECUTE FUNCTION wa_commerce_sessions_updated_at();


-- ─── 2. Message Log (Debugging & Analytics) ──────────────────────

CREATE TABLE IF NOT EXISTS wa_commerce_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Direction: inbound (from user) or outbound (from bot)
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  -- WhatsApp message ID (wamid.xxx)
  wa_message_id TEXT,
  
  -- Phone number (sender for inbound, recipient for outbound)
  phone_number TEXT NOT NULL,
  
  -- Message type classification
  message_type TEXT NOT NULL,
  -- 'text', 'interactive_button', 'interactive_list', 'flow',
  -- 'template', 'image', 'cta_url', 'system'
  
  -- Full message payload (for debugging)
  payload JSONB,
  
  -- Delivery status
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  
  -- Error details (if failed)
  error_message TEXT,
  
  -- Link to order session (if applicable)
  order_session_id UUID REFERENCES wa_commerce_sessions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Sandbox isolation
  is_sandbox BOOLEAN NOT NULL DEFAULT true
);

-- Index for message lookup by WA ID (deduplication check)
CREATE INDEX IF NOT EXISTS idx_wa_commerce_msg_wa_id
  ON wa_commerce_message_log (wa_message_id)
  WHERE wa_message_id IS NOT NULL;

-- Index for phone conversation history
CREATE INDEX IF NOT EXISTS idx_wa_commerce_msg_phone
  ON wa_commerce_message_log (phone_number, created_at DESC);

-- Index for analytics (message type distribution)
CREATE INDEX IF NOT EXISTS idx_wa_commerce_msg_type
  ON wa_commerce_message_log (message_type, created_at);


-- ─── 3. Flow Sessions (Track multi-screen form progress) ────────

CREATE TABLE IF NOT EXISTS wa_commerce_flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to order session
  order_session_id UUID REFERENCES wa_commerce_sessions(id) ON DELETE CASCADE,
  
  -- Flow identification
  flow_name TEXT NOT NULL,     -- 'checkout', 'address', 'feedback'
  flow_id TEXT,                -- Meta Flow ID
  flow_token TEXT,             -- Unique token for this flow instance
  
  -- Current progress
  current_screen TEXT,
  
  -- Accumulated data from completed screens
  screen_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned', 'expired', 'error')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Sandbox isolation
  is_sandbox BOOLEAN NOT NULL DEFAULT true
);

-- Index for active flow lookup
CREATE INDEX IF NOT EXISTS idx_wa_commerce_flow_active
  ON wa_commerce_flow_sessions (order_session_id, status)
  WHERE status = 'active';

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_wa_commerce_flow_updated ON wa_commerce_flow_sessions;
CREATE TRIGGER trg_wa_commerce_flow_updated
  BEFORE UPDATE ON wa_commerce_flow_sessions
  FOR EACH ROW EXECUTE FUNCTION wa_commerce_sessions_updated_at();


-- ─── 4. RLS Policies ────────────────────────────────────────────

ALTER TABLE wa_commerce_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_commerce_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_commerce_flow_sessions ENABLE ROW LEVEL SECURITY;

-- Service role only (API routes use service_role key)
-- Authenticated users should NOT have direct access to these tables
CREATE POLICY "wa_commerce_sessions_service_role" ON wa_commerce_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "wa_commerce_message_log_service_role" ON wa_commerce_message_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "wa_commerce_flow_sessions_service_role" ON wa_commerce_flow_sessions
  FOR ALL USING (auth.role() = 'service_role');


-- ─── 5. Cleanup Function (for CRON) ─────────────────────────────

/**
 * Cleanup expired sessions that were never completed.
 * Should be called periodically via Supabase CRON or external scheduler.
 */
CREATE OR REPLACE FUNCTION wa_commerce_cleanup_expired()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Mark expired pending sessions
  UPDATE wa_commerce_sessions
  SET payment_status = 'expired',
      updated_at = NOW()
  WHERE payment_status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Abandon active flows for expired sessions
  UPDATE wa_commerce_flow_sessions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND order_session_id IN (
      SELECT id FROM wa_commerce_sessions
      WHERE payment_status = 'expired'
    );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
