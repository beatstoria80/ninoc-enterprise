# Alur Kerja Kemitraan Supplier B2B & Arsitektur Finansial (NINOC Enterprise)

Dokumen ini menguraikan alur operasional, administratif, dan finansial dari kerjasama antara NINOC dan Pemasok (Supplier B2B), mulai dari pendaftaran (onboarding) hingga pencatatan bagi hasil dan biaya kampanye di Dashboard Supplier.

---

## 1. Fase Onboarding & Administrasi (Supplier & NINOC Admin)

### Dari Sisi Supplier:
1. **Pendaftaran Akun B2B:** Perwakilan Supplier (misal: IT/Sales dari merek X) mengunjungi halaman pengajuan B2B di website NINOC.
2. **Pengisian Formulir Administratif:** Supplier mengisi kelengkapan legal (NIB, NPWP Perusahaan), kategori produk, kapasitas suplai, dan rekening bank settlement.
3. **Persetujuan Kontrak (MoU):** Setelah berdiskusi dengan tim NINOC, Supplier menyetujui term & condition awal secara digital.

### Dari Sisi NINOC (Admin):
1. **Review Dokumen (Due Diligence):** Tim internal NINOC memverifikasi legalitas dan kecocokan brand.
2. **Approval & Mapping:** Admin menyetujui pengajuan, membuat entitas `supplier_id` di database, dan memetakan akun user perwakilan tersebut ke tabel `supplier_users` (memberikan akses Dashboard Supplier).
3. **Setup Skema Harga (HPP/COGS):** Admin menetapkan persentase margin default atau harga beli tetap (HPP) untuk produk-produk dari supplier tersebut.

---

## 2. Fase Operasional (Penggunaan Dashboard Supplier)

Setelah disetujui, Supplier dapat login dan masuk ke **Dashboard Khusus Supplier B2B** (seperti yang saat ini bisa diakses oleh akun *Dummy IT Review*).

**Fitur Dashboard Supplier (Current & Target):**
- **Katalog & Inventory:** Melihat stok produk mereka yang dititipkan (konsinyasi/crossdock) di gudang NINOC (Hub).
- **Performa Penjualan:** Melihat produk apa saja yang laku dan sedang trending.
- **Financial Balance (Target):** Melihat *Settlement Balance* (uang yang bisa ditarik/dicairkan), potongan platform, dan riwayat biaya tak terduga.

---

## 3. Fase Akuntabilitas Finansial & Dynamic Pricing (Tantangan Saat Ini)

**Kondisi Saat Ini:** 
Dashboard Supplier belum memiliki sistem kalkulasi saldo (Balance) yang mendetail karena harga/potongan setiap produk bisa berbeda-beda dan sering berubah (dinamis).

**Kasus Penggunaan (Use Cases) yang Harus Difasilitasi:**
- **Kasus 1 (Reguler):** Produk A laku dengan HPP tetap. (Harga Jual Rp100.000, HPP Rp70.000 -> Saldo Supplier bertambah Rp70.000).
- **Kasus 2 (Campaign / Event Khusus):** NINOC menjalankan Mega Sale 12.12 atau Ads khusus untuk Produk B. Sesuai kesepakatan, NINOC membebankan biaya iklan/marketing ke Supplier dengan cara **memotong HPP** (Misal: HPP yang awalnya Rp70.000 dipotong Rp5.000 untuk biaya *Ads*, sehingga Supplier hanya menerima Rp65.000).
- **Kasus 3 (Biaya Ekstra Tertentu):** Biaya gudang (storage fee), biaya retur, atau denda keterlambatan pengiriman stok.

---

## 4. Usulan Skema Database Baru (Untuk Akuntabilitas Finansial)

Untuk memastikan bahwa setiap potongan kampanye, HPP dinamis, dan event marketing tercatat secara transparan di Dashboard Supplier, kita perlu membangun arsitektur database berikut:

### A. Tabel `supplier_contracts`
Menyimpan kesepakatan base margin atau HPP default.
- `id` (UUID)
- `supplier_id` (UUID, FK to suppliers)
- `contract_start` (Date)
- `contract_end` (Date)
- `default_margin_percentage` (Numeric)

### B. Tabel `supplier_campaign_agreements`
Mencatat kesepakatan spesifik per event/campaign (Misal: "Promo Kemerdekaan").
- `id` (UUID)
- `supplier_id` (UUID)
- `campaign_name` (String) - *Contoh: "August Flash Sale"*
- `cogs_deduction_amount` (Numeric) - *Potongan HPP tetap, misal: Rp5.000*
- `cogs_deduction_percentage` (Numeric) - *Atau potongan persentase*
- `start_date`, `end_date` (Timestamp)

### C. Tabel `supplier_ledger` (Buku Besar Balance Supplier)
Ini adalah tabel krusial untuk **Dashboard Balance** yang akan menjadi "Rekening Koran" bagi Supplier. Setiap transaksi harus masuk ke sini.
- `id` (UUID)
- `supplier_id` (UUID, FK to suppliers)
- `transaction_type` (Enum: `SALES_REVENUE`, `CAMPAIGN_FEE`, `STORAGE_FEE`, `WITHDRAWAL`)
- `order_id` (UUID, nullable - jika terkait pesanan tertentu)
- `product_id` (UUID, nullable - jika terkait produk tertentu)
- `amount` (Numeric) - *Positif (Pemasukan) atau Negatif (Potongan/Penarikan)*
- `description` (String) - *Misal: "Penjualan Produk A (Order #1234)" atau "Potongan Biaya Ads Campaign Agustus (Produk A)"*
- `created_at` (Timestamp)

### D. Tabel `supplier_balances` (Snapshot)
Untuk mempercepat query *loading* di dashboard (tidak perlu sum/kalkulasi seluruh riwayat ledger setiap saat).
- `supplier_id` (UUID, PK)
- `available_balance` (Numeric)
- `pending_balance` (Numeric)
- `total_withdrawn` (Numeric)

---

## 5. Flow Pembukuan Otomatis (Sistem)

1. **Saat Pembeli Membayar Sukses (Order Completed):**
   - Sistem membaca HPP reguler Produk A.
   - Sistem mengecek apakah ada `supplier_campaign_agreements` yang sedang aktif untuk produk/supplier tersebut hari ini.
   - Jika ada kampanye, sistem menghitung (HPP Reguler - Potongan Kampanye).
   - Sistem menembakkan *Webhook* atau *Edge Function* untuk memasukkan baris baru ke tabel `supplier_ledger`.
     - *Baris 1:* `+ Rp 70.000` (SALES_REVENUE)
     - *Baris 2:* `- Rp 5.000` (CAMPAIGN_FEE - "Potongan Marketing Event Kemerdekaan")
   - `supplier_balances` di-update (Saldo bertambah Rp 65.000).

2. **Saat Supplier Membuka Dashboard:**
   - Halaman "Finance / Balance" menarik data dari `supplier_balances` (untuk angka besar di atas).
   - Daftar mutasi/transaksi di bawahnya menarik riwayat dari `supplier_ledger`, sehingga Supplier bisa melihat dengan jelas mengapa HPP mereka bulan ini lebih kecil (karena ada potongan event sesuai kesepakatan). 

---
*Dokumen ini merupakan Blueprint Arsitektur untuk pengembangan fase B2B Finance di NINOC Enterprise.*
