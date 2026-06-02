# NINOC — SUPABASE SETUP & ADMIN DASHBOARD GUIDE

## Step 1: Run SQL Migrations di Supabase Dashboard

Buka **Supabase Dashboard → SQL Editor → Run scripts berikut secara berurutan:**

### 1A. Schema Utama (jika belum pernah)
```sql
-- Run: supabase_schema.sql
-- Atau buat manual table di Dashboard > Table Editor
```

### 1B. Admin Sync Migration (WAJIB — sync dengan AdminDashboard)
```
supabase/migrations/20250602_admin_sync_v3.sql
```

Jalankan di SQL Editor Supabase.

---

## Step 2: Table yang harus ada di Supabase

### CORE TABLES (sudah ada di schema)
- [x] `products` — with perspective1-4, price_tag, badge_text, specifications
- [x] `variants` — product_id, size, color, stock_quantity
- [x] `orders` — full order management
- [x] `order_items` — line items
- [x] `customer_profiles` — customer data
- [x] `support_tickets` — tickets (with category column)

### NEW TABLES (dari migration v3)
- [x] `product_costing` — pricing calculator per product
- [x] `supplier_cost_log` — audit trail cost changes
- [x] `promo_impact` — promo tracking
- [x] `support_messages` — chat thread per ticket

---

## Step 3: Storage Bucket Setup

1. Buka **Supabase Dashboard → Storage**
2. Buat bucket baru:
   - **Name:** `products`
   - **Public:** ✅ YES (public read)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
3. Copy **Public URL** pattern: `https://[project].supabase.co/storage/v1/object/public/products/`

---

## Step 4: Environment Variables

Pastikan `.env.local` berisi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server-side (API routes). Jangan expose ke client!

---

## Step 5: Row Level Security (RLS) Policies

Semua table sudah di-enable RLS. Policy yang perlu dicek:

### Products & Variants
```sql
-- Public read untuk visitor
CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON variants FOR SELECT USING (true);
```

### Orders (guest checkout support)
```sql
CREATE POLICY "Allow order creation" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
```

### Admin Tables (service role bypass)
```sql
-- product_costing, supplier_cost_log, promo_impact, support_messages
-- Policy: SELECT/INSERT/UPDATE menggunakan service role key
-- Service role bypasses RLS — aman karena hanya di server-side
```

---

## Step 6: Admin Dashboard Access

1. Buka `/admin` di browser
2. Login dengan admin account (via Supabase Auth)
3. Sidebar navigation:
   - **Dashboard** — overview stats
   - **Product** — CRUD products & variants
   - **Upload Images** — bulk image upload to Supabase Storage
   - **Transaction** — orders management
   - **Membership** — customer profiles
   - **Info Stock** — inventory management
   - **Report** — finance & costing
   - **Support Chat** — customer support messaging

---

## Step 7: Data Flow Diagram

```
Admin Dashboard
    ↓
Supabase (service role key — server-side only)
    ├── products → variants (CRUD)
    ├── orders → order_items (management)
    ├── customer_profiles (view/edit)
    ├── product_costing (pricing)
    ├── support_tickets → support_messages (chat)
    └── Storage: products bucket (image upload)

Customer Website
    ↓
Supabase (anon key — client-side)
    ├── products → variants (read only)
    ├── orders (create, read own)
    └── customer_profiles (manage own)
```

---

## Step 8: Troubleshooting

### "Table not found" errors
→ Pastikan semua table sudah dibuat via migration SQL

### "Bucket not found" on image upload
→ Buat bucket `products` di Supabase Dashboard → Storage

### RLS policy blocking reads
→ Cek policy di Supabase Dashboard → Table → Policies

### Auth not working
→ Cek Supabase Auth settings di Dashboard → Authentication
→ Pastikan site URL & redirect URLs sudah benar

---

## Quick Checklist

- [ ] Run `supabase_schema.sql` (schema utama)
- [ ] Run `20250602_admin_sync_v3.sql` (admin sync)
- [ ] Buat storage bucket `products` (public)
- [ ] Set environment variables di `.env.local`
- [ ] Test `/admin` page — login & navigate tabs
- [ ] Test image upload di **Upload Images** tab
- [ ] Verify products muncul di Catalog/Shop page
- [ ] Verify orders sync dengan payment gateway

---

Generated: 2026-06-02 | NINOC Archive Studio