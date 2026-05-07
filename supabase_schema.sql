-- 1. Bersihkan tabel lama jika ada
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS products;

-- 2. Bersihkan Type lama jika ada agar tidak bentrok
DROP TYPE IF EXISTS category_type;
DROP TYPE IF EXISTS main_category_type;

-- 3. Buat Type Kategori Baru
CREATE TYPE main_category_type AS ENUM ('fashion', 'accessories', 'utilities');

-- 4. Buat Tabel Produk dengan Struktur Baru
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  category main_category_type NOT NULL DEFAULT 'fashion',
  sub_category TEXT, -- Tempat menyimpan 'tops_adult', 'tshirts_graphic', dll.
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Buat Tabel Varian
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size TEXT, 
  color TEXT,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Buat Tabel Pesanan
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  total_price BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  payment_url TEXT,
  snap_token TEXT,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Aktifkan Keamanan (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 8. Kebijakan Izin Akses (Policies)
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read variants" ON variants FOR SELECT USING (true);
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
