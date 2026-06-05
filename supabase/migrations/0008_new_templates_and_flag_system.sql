-- ============================================================
-- New Auto-Reply Templates + Flagged System
-- Run after 0006_placeholder_configs.sql
-- ============================================================

-- ─── Add Flagging Columns to support_tickets ────────────────────────────────
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flagged_severity VARCHAR(10); -- 'sara' | 'nsfw'

ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- ─── New Placeholder Templates ──────────────────────────────────────────────

-- SARA Warning — sends warning to customer, flags ticket for admin review
INSERT INTO placeholder_configs (label, content, category, sort_order) VALUES
  ('Peringatan Konten', '⚠️ Kami memperhatikan pesan Anda mengandung konten yang kurang pantas. Silakan kirim ulang dengan bahasa yang sopan. Tim kami akan meninjau pesan ini.', 'sara_warn', 1),
  ('Warning SARA', 'Kami tidak dapat memproses pesan dengan konten yang mengandung penghinaan atau diskriminasi. Silakan berkomunikasi dengan sopan. Pesan ini telah dilaporkan ke tim kami untuk ditinjau.', 'sara_warn', 2),

-- NSFW Reject — silent reject to customer, flags ticket, no auto-reply displayed
  ('Konten Tidak Pantas', '⚠️ Kami tidak dapat memproses pesan ini karena mengandung konten yang tidak pantas. Silakan kirim ulang dengan bahasa yang sopan. Terima kasih.', 'nsfw_reject', 1),
  ('Pornografi Warning', 'Kami tidak dapat memproses pesan ini. Pesan Anda mengandung konten dewasa yang tidak diizinkan. Silakan kirim ulang dengan topik yang sesuai.', 'nsfw_reject', 2),

-- English — bilingual friendly response for English-speaking customers
  ('English Greeting', 'Hello! Thank you for contacting NINOC. We''ve received your message and our team will respond shortly. We''re here to help! 🙏', 'english', 1),
  ('English Return', 'Hello! For return or refund requests, please provide your order ID and describe the issue. Our team will process it within 1-2 business days. Thank you! 🙏', 'english', 2),
  ('English Shipping', 'Hello! To track your order, please provide your order ID or tracking number. We''ll update you as soon as possible. Thank you! 🙏', 'english', 3),
  ('English Payment', 'Hello! For payment-related inquiries, please share your order ID and proof of payment. Our team will verify it promptly. Thank you! 🙏', 'english', 4),
  ('English General', 'Hello! Thank you for reaching out to NINOC. Our team is here to help. Please share more details so we can assist you better. 🙏', 'english', 5),

-- Complaint — empathetic response for dissatisfied customers
  ('Empati Keluhan', 'Kami sangat menyesalkan pengalaman Anda. Mohon maaf atas ketidaknyamanan yang terjadi. Silakan ceritakan detail masalahnya — tim kami akan segera menanganinya dan memberikan solusi terbaik.', 'complaint', 1),
  ('Keluhan Keterlambatan', 'Kami memahami ketidaknyamanan Anda terkait keterlambatan. Mohon maaf atas hal ini. Tim kami sedang berkoordinasi dengan pihak ekspedisi untuk memastikan pesanan Anda segera sampai.', 'complaint', 2),
  ('Keluhan Barang Rusak', 'Kami sangat menyesalkan听到 barang Anda sampai dalam kondisi tidak sempurna. Mohon maaf untuk ketidaknyamanan ini. Kami akan segera memproses retur atau penukaran untuk Anda.', 'complaint', 3),
  ('Tidak Sesuai Deskripsi', 'Kami memohon maaf jika barang yang diterima tidak sesuai deskripsi. Mohon kirimkan foto barang dan detail pesanan Anda — tim kami akan segera menangani hal ini.', 'complaint', 4),

-- Product — informative response for product inquiries
  ('Info Ukuran', 'Untuk informasi ukuran, silakan cek halaman produk yang Anda minati — kami menyediakan size chart di setiap produk. Jika masih ragu, tim kami siap membantu dengan mengukur langsung.', 'product', 1),
  ('Info Stok', 'Untuk ketersediaan stok, silakan sebutkan produk dan ukuran yang Anda cari. Tim kami akan mengecek stok terkini dan segera merespons.', 'product', 2),
  ('Info Warna', 'Kami memiliki berbagai warna untuk setiap produk. Silakan sebutkan warna yang Anda inginkan — tim kami akan mengecek ketersediaannya.', 'product', 3),
  ('Info Bahan', 'Produk NINOC terbuat dari bahan berkualitas tinggi dengan detail spesifikasi yang tertera di halaman masing-masing produk. Silakan cek atau hubungi kami untuk informasi lebih lanjut.', 'product', 4),

-- General Inquiry
  ('Info Studio', 'NINOC adalah brand fashion lokal yang beroperasi dari studio kami. Untuk informasi lebih lanjut, silakan kunjungi halaman About kami atau hubungi langsung via chat ini. 🙏', 'general', 1),
  ('Info Pemesanan', 'Untuk melakukan pemesanan, silakan browse katalog kami di halaman Shop. Pilih produk, tambahkan ke keranjang, dan lakukan checkout. Tim kami akan memproses pesanan setelah pembayaran terkonfirmasi.', 'general', 2),
  ('Info Kontak', 'Anda bisa menghubungi kami melalui: 1) Chat widget ini, 2) WhatsApp (lihat footer), 3) Email. Tim kami merespons dalam 1-2 hari kerja. 🙏', 'general', 3),

-- Enhanced Closing — better closing templates
  ('Closing Spesifik', 'Terima kasih telah menghubungi NINOC. Tim kami akan segera menindaklanjuti permintaan Anda. Jika ada pertanyaan lain, silakan hubungi kami kapan saja. 🙏', 'closing', 1),
  ('Closing Keluhan', 'Kami menghargai masukan Anda dan akan terus memperbaiki layanan kami. Mohon tunggu tanggapan dari tim kami. Terima kasih sudah sabar! 🙏', 'closing', 2);