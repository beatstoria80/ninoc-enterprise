-- ============================================================
-- WhatsApp Broadcast Queue Tables
-- Supports: bulk message queue with batch processing
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 1. WhatsApp Broadcast Sessions
--    One record per broadcast campaign
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wa_broadcast_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                        -- Campaign name (e.g. "Promo Juni 2026")
  segment TEXT NOT NULL DEFAULT 'all',         -- Segment: 'all', 'has_order', 'new_customer', 'product_xxx'
  template_name TEXT NOT NULL,                 -- Meta-approved template name
  template_message TEXT,                       -- Full message text (for preview)
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'processing', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,                            -- Admin user id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE wa_broadcast_sessions IS 'WhatsApp broadcast campaign sessions';

-- ─────────────────────────────────────────────────────────
-- 2. WhatsApp Broadcast Queue
--    Individual messages queued for sending
--    Processed by cron job in batches
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wa_broadcast_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES wa_broadcast_sessions(id) ON DELETE CASCADE,

  -- Recipient info
  phone TEXT NOT NULL,                        -- Formatted: 62XXXXXXXXXX
  customer_name TEXT,
  customer_id UUID,                            -- Optional: link to user_profiles

  -- Message content
  template_name TEXT NOT NULL,
  message_preview TEXT,                        -- Full text for preview

  -- Processing state
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'retry')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Meta response
  whatsapp_message_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processing_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Ensure unique phone per broadcast
  UNIQUE (broadcast_id, phone)
);

COMMENT ON TABLE wa_broadcast_queue IS 'Individual queued messages for WhatsApp broadcast';

-- ─────────────────────────────────────────────────────────
-- 3. WhatsApp Send Log (audit trail for transactional messages)
--    Invoice & shipping notifications
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wa_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('invoice', 'shipping', 'delivered', 'custom')),
  order_id TEXT,                              -- Link to orders table

  -- Recipient
  phone TEXT NOT NULL,
  customer_name TEXT,

  -- Message details
  template_name TEXT,
  message_content TEXT,

  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  whatsapp_message_id TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

COMMENT ON TABLE wa_send_log IS 'Audit log for transactional WhatsApp messages (invoice, shipping)';

-- ─────────────────────────────────────────────────────────
-- 4. WhatsApp Settings (per-store configuration)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wa_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  phone_number_id TEXT,
  access_token TEXT,
  waba_id TEXT,
  webhook_verify_token TEXT,
  enabled BOOLEAN DEFAULT false,
  auto_send_invoice BOOLEAN DEFAULT true,
  auto_send_shipping BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE wa_settings IS 'WhatsApp Cloud API configuration';

-- Insert default settings row
INSERT INTO wa_settings (id, enabled, auto_send_invoice, auto_send_shipping)
VALUES ('default', false, true, true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- 5. Enable Row Level Security
-- ─────────────────────────────────────────────────────────
ALTER TABLE wa_broadcast_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_broadcast_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_settings ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────
-- 6. Access Policies
-- ─────────────────────────────────────────────────────────

-- wa_broadcast_sessions: admin only (service role)
CREATE POLICY "Admin manage broadcast sessions" ON wa_broadcast_sessions
  FOR ALL USING (true);

-- wa_broadcast_queue: admin only
CREATE POLICY "Admin manage broadcast queue" ON wa_broadcast_queue
  FOR ALL USING (true);

-- wa_send_log: admin read, service role write
CREATE POLICY "Admin read send log" ON wa_send_log
  FOR SELECT USING (true);
CREATE POLICY "Service insert send log" ON wa_send_log
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update send log" ON wa_send_log
  FOR UPDATE USING (true);

-- wa_settings: admin read, service role write
CREATE POLICY "Admin read wa settings" ON wa_settings
  FOR SELECT USING (true);
CREATE POLICY "Service manage wa settings" ON wa_settings
  FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────
-- 7. Indexes
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wa_broadcast_queue_status ON wa_broadcast_queue(status);
CREATE INDEX IF NOT EXISTS idx_wa_broadcast_queue_broadcast ON wa_broadcast_queue(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_wa_broadcast_queue_pending ON wa_broadcast_queue(status, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_wa_send_log_order ON wa_send_log(order_id);
CREATE INDEX IF NOT EXISTS idx_wa_send_log_type ON wa_send_log(type);
CREATE INDEX IF NOT EXISTS idx_wa_broadcast_sessions_status ON wa_broadcast_sessions(status);

-- ─────────────────────────────────────────────────────────
-- 8. Function: Get next batch for queue processing
--    Called by cron job — returns up to N pending jobs
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_next_wa_queue_batch(batch_size INTEGER DEFAULT 10)
RETURNS SETOF wa_broadcast_queue AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM wa_broadcast_queue
  WHERE status IN ('pending', 'retry')
    AND (next_retry_at IS NULL OR next_retry_at <= NOW())
  ORDER BY created_at ASC
  LIMIT batch_size
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_next_wa_queue_batch IS 'Get next batch of pending WA messages for processing';

-- ─────────────────────────────────────────────────────────
-- 9. Function: Update queue item after send attempt
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_wa_queue_item(
  p_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_whatsapp_message_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE wa_broadcast_queue
  SET
    status = p_status,
    error_message = p_error_message,
    whatsapp_message_id = p_whatsapp_message_id,
    processing_at = CASE WHEN p_status = 'processing' THEN NOW() ELSE processing_at END,
    sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
    retry_count = CASE WHEN p_status = 'retry' THEN retry_count + 1 ELSE retry_count END,
    next_retry_at = CASE
      WHEN p_status = 'retry' AND retry_count + 1 < max_retries
        THEN NOW() + (power(2, retry_count + 1) * interval '1 minute')
      ELSE NULL
    END
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_wa_queue_item IS 'Update a queue item after send attempt';
