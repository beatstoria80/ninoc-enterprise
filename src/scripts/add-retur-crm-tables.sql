-- ============================================================
-- NINOC Support Center — Phase 2 Migration
-- Retur System + CRM Activity Log + Extended Ticket Fields
-- ============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create retur_requests table
CREATE TABLE IF NOT EXISTS retur_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'rusak_cacat', 'salah_ukuran', 'salah_warna', 'tidak_sesuai',
    'tidak_terima', 'lainnya'
  )),
  reason_label TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_uploaded_at TIMESTAMPTZ,
  video_duration_seconds INT,
  video_filename TEXT,
  return_type TEXT NOT NULL DEFAULT 'refund' CHECK (return_type IN ('refund', 'exchange')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewed', 'approved', 'rejected', 'completed', 'cancelled'
  )),
  fraud_suspected BOOLEAN DEFAULT FALSE,
  fraud_reasons TEXT[],
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  refund_amount BIGINT,
  refund_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for retur_requests
CREATE INDEX IF NOT EXISTS retur_requests_user_id_idx ON retur_requests(user_id);
CREATE INDEX IF NOT EXISTS retur_requests_order_id_idx ON retur_requests(order_id);
CREATE INDEX IF NOT EXISTS retur_requests_status_idx ON retur_requests(status);
CREATE INDEX IF NOT EXISTS retur_requests_created_at_idx ON retur_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS retur_requests_ticket_id_idx ON retur_requests(ticket_id);

-- 3. Create customer_activity_log table (CRM)
CREATE TABLE IF NOT EXISTS customer_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'chat_started', 'chat_message', 'ticket_created', 'ticket_resolved',
    'retur_submitted', 'retur_approved', 'retur_rejected', 'retur_completed',
    'order_placed', 'order_completed', 'complaint_flagged',
    'auto_reply_sent', 'admin_reply_sent', 'note_added', 'priority_changed'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customer_activity_log
CREATE INDEX IF NOT EXISTS customer_activity_log_user_id_idx ON customer_activity_log(user_id);
CREATE INDEX IF NOT EXISTS customer_activity_log_activity_type_idx ON customer_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS customer_activity_log_created_at_idx ON customer_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS customer_activity_log_guest_idx ON customer_activity_log(guest_session_id) WHERE guest_session_id IS NOT NULL;

-- 4. Extend support_tickets with CRM fields
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_notes TEXT,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_time_seconds INT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'chat' CHECK (source IN ('chat', 'retur', 'help', 'returns_api', 'profile')),
  ADD COLUMN IF NOT EXISTS last_auto_reply_category TEXT;

CREATE INDEX IF NOT EXISTS support_tickets_priority_idx ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS support_tickets_assigned_to_idx ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_source_idx ON support_tickets(source);

-- 5. Extend support_messages with analytics fields
ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS is_auto_reply BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_reply_category TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS support_messages_ticket_id_created_idx ON support_messages(ticket_id, created_at);

-- 6. Create auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_retur_requests_updated_at ON retur_requests;
CREATE TRIGGER update_retur_requests_updated_at
  BEFORE UPDATE ON retur_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS for new tables
ALTER TABLE retur_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activity_log ENABLE ROW LEVEL SECURITY;

-- Retur requests: consumer sees own, admin sees all
DROP POLICY IF EXISTS "retur_consumer_own" ON retur_requests;
CREATE POLICY "retur_consumer_own" ON retur_requests
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "retur_consumer_insert" ON retur_requests;
CREATE POLICY "retur_consumer_insert" ON retur_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "retur_consumer_update" ON retur_requests;
CREATE POLICY "retur_consumer_update" ON retur_requests
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "retur_admin_all" ON retur_requests;
CREATE POLICY "retur_admin_all" ON retur_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Customer activity log: consumer sees own, admin sees all
DROP POLICY IF EXISTS "activity_log_read" ON customer_activity_log;
CREATE POLICY "activity_log_read" ON customer_activity_log
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "activity_log_insert" ON customer_activity_log;
CREATE POLICY "activity_log_insert" ON customer_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "activity_log_admin_all" ON customer_activity_log;
CREATE POLICY "activity_log_admin_all" ON customer_activity_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 8. Support tickets extended fields RLS
DROP POLICY IF EXISTS "support_tickets_admin_update_fields" ON support_tickets;
CREATE POLICY "support_tickets_admin_update_fields" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    ) OR auth.uid() = user_id
  );

-- 9. Create storage bucket for unboxing videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'retur-videos',
  'retur-videos',
  FALSE,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for retur videos
DROP POLICY IF EXISTS "retur_videos_upload" ON storage.objects;
CREATE POLICY "retur_videos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'retur-videos'
    AND (auth.uid() IS NOT NULL OR auth.role() = 'authenticated')
  );

DROP POLICY IF EXISTS "retur_videos_read" ON storage.objects;
CREATE POLICY "retur_videos_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'retur-videos'
    AND (auth.uid() IS NOT NULL OR auth.role() = 'authenticated')
  );

-- 10. Verify
SELECT 'Migration completed successfully' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('retur_requests', 'customer_activity_log');
