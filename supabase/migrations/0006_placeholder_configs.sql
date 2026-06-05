-- ============================================================
-- Placeholder Config System for NINOC Enterprise
-- Admin can pre-configure quick-reply templates for support chat
-- ============================================================

-- Drop existing table
DROP TABLE IF EXISTS placeholder_configs CASCADE;

-- Create placeholder_configs table
CREATE TABLE placeholder_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label VARCHAR(100) NOT NULL,             -- Short name shown in dropdown
  content TEXT NOT NULL,                    -- Full message template
  category VARCHAR(50) DEFAULT 'general',   -- 'greeting', 'closing', 'return', 'shipping', 'payment', 'general'
  sort_order INT DEFAULT 0,                 -- Manual ordering within category
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_placeholder_configs_category ON placeholder_configs(category);
CREATE INDEX idx_placeholder_configs_active ON placeholder_configs(is_active);
CREATE INDEX idx_placeholder_configs_sort ON placeholder_configs(sort_order);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE placeholder_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active placeholders (for support chat dropdown)
CREATE POLICY "public_read_active" ON placeholder_configs
  FOR SELECT USING (is_active = true);

-- Only authenticated users can manage placeholders
CREATE POLICY "admin_manage" ON placeholder_configs
  FOR ALL USING (true);

-- ============================================================
-- Default Seed Data
-- ============================================================
INSERT INTO placeholder_configs (label, content, category, sort_order) VALUES
  -- Greetings
  ('Salam Hangat', 'Halo! Terima kasih telah menghubungi NINOC. Kami siap membantu Anda. Silakan ceritakan keluhan Anda, ya 🙂', 'greeting', 1),
  ('Respon Cepat', 'Terima kasih telah menghubungi. Kami sedang memproses permintaan Anda dan akan segera merespons.', 'greeting', 2),
  ('Tunggu Sebentar', 'Mohon tunggu sebentar, ya. Tim kami sedang meninjau permintaan Anda.', 'greeting', 3),

  -- Returns & Refunds
  ('Status Retur', 'Kami telah menerima permintaan retur Anda. Tim kami akan meninjau dalam 1-2 hari kerja dan menghubungi Anda setelahnya.', 'return', 1),
  ('Konfirmasi Retur', 'Permintaan retur Anda telah dikonfirmasi. Mohon kirimkan barang yang ingin diretur dalam waktu 7 hari ke alamat kami. Kami akan segera memproses refund setelah barang diterima.', 'return', 2),
  ('Refund Diproses', 'Refund Anda sedang dalam proses. Mohon tunggu 3-5 hari kerja untuk dana masuk ke rekening Anda.', 'return', 3),
  ('Retur Ditolak', 'Mohon maaf, permintaan retur Anda tidak dapat diproses karena tidak memenuhi syarat. Silakan hubungi kami untuk informasi lebih lanjut.', 'return', 4),
  ('Retur Selesai', 'Retur Anda telah selesai diproses. Dana sudah dikembalikan ke metode pembayaran asli. Terima kasih atas kesabarannya!', 'return', 5),

  -- Shipping
  ('Info Pengiriman', 'Pesanan Anda sedang dalam proses persiapan. Estimasi pengiriman 2-4 hari kerja tergantung lokasi.', 'shipping', 1),
  ('Lacak Pesanan', 'Anda bisa melacak pesanan di halaman [Track Order] dengan nomor pesanan Anda. Kami akan memberi tahu jika ada update.', 'shipping', 2),
  ('Shipping Delay', 'Mohon maaf atas keterlambatan pengiriman. Kami sedang koordinasi dengan pihak ekspedisi dan akan segera memberikan update.', 'shipping', 3),

  -- Payment
  ('Konfirmasi Pembayaran', 'Pembayaran Anda telah kami terima. Pesanan akan segera diproses.', 'payment', 1),
  ('Menunggu Pembayaran', 'Kami belum menerima pembayaran untuk pesanan ini. Silakan lakukan pembayaran agar pesanan dapat diproses.', 'payment', 2),
  ('Pembayaran Gagal', 'Pembayaran belum berhasil. Silakan coba lagi atau gunakan metode pembayaran lain.', 'payment', 3),

  -- Closing
  ('Terima Kasih', 'Terima kasih telah menghubungi NINOC. Jika ada pertanyaan lain, jangan ragu untuk menghubungi kami kembali.', 'closing', 1),
  ('Harap Bersabar', 'Kami menghargai kesabaran Anda. Tim kami sedang bekerja keras untuk menyelesaikan permintaan Anda.', 'closing', 2),
  ('Penutup CS', 'Ada yang bisa kami bantu lagi? Kami selalu siap membantu Anda 😊', 'closing', 3);