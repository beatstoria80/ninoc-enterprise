# 📚 Dokumentasi Sistem Admin Dashboard

## 1. Arsitektur Umum
Admin Dashboard beroperasi sebagai aplikasi *Single Page Application (SPA)* bernuansa monolitik yang digerakkan oleh `src/app/admin/page.tsx`. Sistem ini menggunakan pendekatan **Tab-Based Navigation** untuk merender komponen secara dinamis tanpa memuat ulang (reload) halaman penuh.

- **Framework:** Next.js 15 (App Router)
- **State Management:** *React useState* (Global state disimpan di `page.tsx` dan didistribusikan via *Props*).
- **Real-Time Data:** Supabase WebSockets (mendengarkan perubahan di tabel `customer_profiles`, `retur_requests`, dan `support_tickets`).
- **Styling:** Tailwind CSS dengan animasi transisi dari Framer Motion.

## 2. Struktur Modul & Fitur (Tabs)

Sistem dibagi ke dalam beberapa modul operasi utama:

### 📊 A. Ringkasan Bisnis (Overview)
- **Komponen:** `OverviewTab.tsx`
- **Fungsi:** Menampilkan *High-Level Metrics* (Total Pendapatan, Pesanan Menunggu, Stok Menipis).
- **Data Source:** Agregasi sisi server via endpoint `/api/admin/finance-summary` untuk menghindari pengambilan ribuan data baris (limit 1000).

### 📦 B. Manajemen Katalog & Stok
- **Produk (`ProductsTab.tsx`):** Manajemen katalog, CRUD produk, manajemen Varian (Warna, Ukuran), penentuan HPP (Harga Pokok Penjualan), dan fitur *Toggle Featured*.
- **Bulk Upload (`UploadTab.tsx`):** Fitur untuk mengunggah ratusan gambar produk secara massal dengan kompresi otomatis.
- **Inventory & Opname:** Meliputi `InventoryTab.tsx`, `PoManager`, `DoReceiving`, `StockLedger`, dan `StockOpname` untuk mencatat pergerakan barang secara mutlak (sistem Ledger stok).

### 🛒 C. Manajemen Pesanan & Logistik
- **Daftar Pesanan (`OrdersTab.tsx`):** Menampilkan pesanan berdasarkan status (Pending, Paid, Shipped). Termasuk fitur **Bulk Print Resi** menggunakan injeksi *JsBarcode* dan pembacaan *Barcode Scanner* melalui keyboard listener.
- **Logistik & Ekspedisi (`LogisticsTab.tsx`):** Terintegrasi langsung dengan Biteship. Menyediakan fitur **Request Pickup (Panggil Kurir)** otomatis yang memicu penjemputan barang ke gudang (Drop-off/Pickup) dan melacak resi (*Waybill*). Memiliki *Scanner* antarmuka untuk mencegah barang keluar ganda (Fraud).

### 💬 D. Interaksi Pelanggan
- **Pesan (`MessagesTab`):** *Ticketing system* (CRM) untuk menjawab pertanyaan pelanggan dari *storefront*. Mendukung sinkronisasi *real-time* ganda (admin-customer).
- **Pelanggan (`CustomersTab`):** Database pelanggan, metrik pembelanjaan, dan analitik RFM (Recency, Frequency, Monetary).
- **Retur & Pengembalian Dana:** Manajemen retur pesanan (*Refund/Exchange*).

### 💰 E. Keuangan (Finance)
- **Komponen:** `FinanceTab.tsx` (termasuk *Profit & Loss*, *Ledger*, *Balance*, *Tax*).
- **Fungsi:** Menganalisa HPP, beban operasional, biaya layanan (Platform Fee Midtrans), dan pembagian margin afiliasi secara otomatis.

## 3. Alur Sinkronisasi Data (Data Flow)
Admin Dashboard menggunakan pola **Optimistic State Updates** untuk memaksimalkan performa:
1. **Mutasi Terjadi:** Admin menekan tombol (contoh: *Ubah Status Pesanan* atau *Cetak Resi*).
2. **Database Update:** Komponen memanggil fungsi `supabase.from(...).update(...)` atau API route.
3. **Optimistic UI:** UI tidak menunggu data baru di-*download* ulang. Melainkan, *global state* (`orders`, `products`) langsung di-edit menggunakan operasi *Map/Filter* (`setOrders(prev => prev.map(...))`).
4. **Latency:** Memberikan pengalaman aplikasi dengan *0ms network latency* di sisi antarmuka.

## 4. Keamanan & Integritas
- **Otentikasi:** Setiap kali termuat, halaman memverifikasi sesi melalui `supabase.auth.getUser()` dan mengecek otoritas pada tabel `admin_roles`. Jika ditolak, sesi dibatalkan (*auto-logout*).
- **Idempotency:** Pada interaksi cetak resi dan mutasi status, terdapat pengecekan ganda untuk mendeteksi *Fraud* (misal: order sudah dikirim, tapi dicetak ulang).
