-- Menambahkan kolom payment_method ke tabel orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
