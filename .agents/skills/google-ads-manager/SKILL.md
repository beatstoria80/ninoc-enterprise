---
name: google-ads-manager
description: Panduan langkah demi langkah untuk membuat dan mengelola kampanye Google Ads. Fokus pada e-commerce, strategi link Shopee/Marketplace, alokasi budget harian, dan metode pembayaran di Indonesia.
---

# Google Ads Manager Skill (E-commerce & Marketplace)

Skill ini mendokumentasikan prosedur standar untuk membantu user membuat iklan Google Ads, terutama jika mereka ingin mengarahkan trafik ke marketplace (seperti Shopee) atau website resmi.

## 1. Menentukan Tujuan & Jenis Kampanye
- **Untuk Website Resmi:** Jika user punya akses kode website (misal `ninoc.store`), arahkan user untuk menggunakan goal **Sales** (Penjualan).
- **Untuk Link Marketplace (Shopee/Tokopedia):** Jangan gunakan goal *Sales* karena user tidak bisa memasang Google Tag (Conversion Tracking) di server marketplace. 
  - **Tindakan:** Arahkan user untuk menggunakan goal **Page views** (Tampilan Halaman) atau **Website traffic**.
- **Campaign Type:** Gunakan **Search** (Penelusuran) untuk pemula agar iklan muncul saat audiens mencari kata kunci tertentu.

## 2. Struktur Akun (Manager vs Child Account)
- Jika user menggunakan **Google Ads Manager Account (MCC)**, mereka tidak bisa langsung membuat kampanye.
- **Tindakan:** Pastikan user membuat **Child Account** (Akun Iklan Anak) terlebih dahulu melalui menu *Accounts* > *Create new account*. Setelah itu, user harus masuk ke akun anak tersebut untuk membuat kampanye.

## 3. Strategi Pengisian URL & Assets (Mencapai "Excellent" Ad Strength)
- **Final URL Spesifik Produk:** Wajib menggunakan URL langsung ke halaman produk spesifik (misal: `https://shopee.co.id/Kaos-X-i.123...`), **BUKAN** sekadar beranda toko (`shopee.co.id/namatoko`). Kesalahan ini menyebabkan *bounce rate* tinggi.
- **AI Generate Assets:** Minta user menekan tombol **Skip** saat Google menawarkan fitur *Generate Assets* menggunakan AI jika link tujuan adalah marketplace. AI Google kesulitan memilah elemen desain marketplace.
- **Maksimalkan Teks (Headlines & Descriptions):** Algoritma *Performance Max* sangat rakus data. Untuk mencapai status **Excellent**, user wajib mengisi **semua kuota**: 15 *Headlines* (Maks 30 huruf) dan 4 *Descriptions* (Maks 90 huruf) secara manual dengan variasi yang kaya (contoh: ajakan beli, fitur bahan, promo gratis ongkir).
- **Search Themes (Sangat Krusial):** Jangan biarkan kolom *Search themes* kosong (status *"No search themes provided"*). Wajib ketikkan 5-25 kata kunci manual agar AI tidak menebak-nebak target audiens dari nol.

## 4. Strategi Bidding & Conversion Goals
- **Conversion Goals (Penting untuk Marketplace):** Saat di menu *Campaign Settings*, pastikan pengaturan *Conversion goals* diubah dari `Account-default` (yang biasanya melacak *Purchase*) menjadi **`Campaign-specific`**. Kemudian pilih **Page views** atau **Website traffic**. Jika tidak diubah, Google akan terus memunculkan peringatan *"Conversion tracking setup is incomplete"*.
- **Bid Strategy:** Pilih **Conversions** (yang dalam kasus marketplace dihitung sebagai *Page views* berkat pengaturan di atas).
- **Target CPA:** Pastikan kotak **"Set a target cost per action"** TIDAK DICENTANG untuk kampanye baru. Biarkan AI Google mencari trafik termurah berdasarkan budget harian.

## 5. Pengaturan Anggaran Harian (Budget)
- **Abaikan Rekomendasi Google:** Google sering merekomendasikan budget harian yang sangat besar (bisa jutaan rupiah/hari).
- **Custom Budget:** Arahkan user untuk memilih **Set custom budget** dan memasukkan nominal yang aman untuk tahap pengujian (testing), misalnya Rp 25.000 hingga Rp 100.000 per hari.
- Beri tahu user bahwa tagihan bulanan tidak akan pernah melebihi (budget harian x 30.4 hari).

## 6. Penagihan & Pembayaran (Billing)
- **Metode Pembayaran:** Jika user tidak menggunakan kartu kredit, arahkan ke **Money transfer** (Transfer Bank).
- **Pertanyaan Wajib EU:** Minta user mencentang opsi "No, this campaign doesn't have EU political ads" untuk iklan e-commerce di Indonesia.
- **Top-up Saldo:** Google Indonesia umumnya membutuhkan transfer manual minimal Rp 100.000 via Virtual Account (Citibank) jika memilih Money Transfer. 
- Saldo terpotong sesuai *Custom Budget* (misal Rp 25.000/hari). Iklan otomatis tayang setelah saldo masuk (proses 1-2 hari kerja) dan iklan selesai di-review.

## 7. Pengaturan Durasi (Start & End Dates)
- Selalu ingatkan user untuk mengatur **End Date** (Tanggal Berakhir) terutama untuk produk edisi musiman/promosi spesifik (seperti edisi 17 Agustus, Lebaran, dll) agar saldo tidak terus terpotong ketika kampanye sudah tidak relevan.
- **Cara:** Masuk ke menu *Campaigns* > Pilih kampanye > *Settings* > *Start and end dates*.

## 8. Troubleshooting Campaign Diagnostics (Status Merah & Kuning)
- **"New bid strategy is learning":** Ini adalah pesan normal (biru) saat kampanye baru tayang. Algoritma sedang belajar mengoptimalkan *budget*. Tidak ada tindakan yang perlu dilakukan.
- **"Ad strength is poor" / Incomplete assets (Peringatan Kuning):** Kampanye tidak akan berjalan optimal atau tayangan dibatasi karena AI Google kekurangan variasi data. Arahkan user untuk masuk ke **Edit asset group**. Syarat mutlak merubah *Poor* menjadi *Good/Excellent*:
  1. Lengkapi 15 *Headlines* dan 4 *Descriptions* (jangan ada yang kosong).
  2. Tambahkan minimal 5 *Search themes* (Kata kunci manual).
  3. Upload variasi gambar (minimal 3 Horizontal/Landscape 1.91:1 dan 3 Kotak/Square 1:1). Jangan gunakan gambar identik berulang kali, buat variasi (fokus produk, pemakaian dengan model, beda warna).
- **"Asset group under review" (Status Pending):** Setelah user menekan Save/Simpan dari hasil *Edit asset group*, status *Ad Strength* akan berubah menjadi indikator *loading* (Pending). Beri tahu user bahwa ini normal; Google butuh 1-24 jam untuk meninjau iklan sebelum mengkalkulasi ulang skor kekuatannya.
- **"Account balance is exhausted" & "Not eligible" (Peringatan Merah):** Kasus ini sering membuat panik user yang baru pertama kali *Top-up* manual (*Money Transfer*/Virtual Account). Jika user sudah mentransfer (misal Rp 100.000), peringatan merah ini **akan tetap muncul selama 1-2 hari kerja** karena dana sedang diproses oleh Payment Gateway. Jelaskan kepada user agar tidak panik dan cukup menunggu. Gembok merah otomatis terbuka, iklan otomatis berjalan, dan label *Impression detection issue* otomatis hilang begitu saldo mendarat di sistem Google.
- **Kampanye "Tidak Valid" dengan peringatan "Saldo akun habis":** Jika di halaman **Diagnostik Kampanye** statusnya "Tidak valid" tapi tab **Iklan (Ads)** dan tab lainnya mendapat centang hijau (✅), ini berarti iklan dan URL sudah 100% disetujui (Approved). Status "Tidak valid" murni karena saldo Rp0. User hanya perlu menambah dana (Top-up).

## 9. Troubleshooting Kebijakan (Policy Violations)
- **"Tujuan iklan tidak berfungsi (HTTP:404, Platform: Android)"**: 
  - **Penyebab Utama:** Ini berarti *Google AdsBot* (crawler) menerima error 404 (Halaman Tidak Ditemukan) saat mencoba memverifikasi URL. Masalah ini **bukan** karena kesalahan konfigurasi GTM/Tracking di *backend*, melainkan karena **typo pada Final URL** (misal `https:ninoc.store` kurang garis miring) ATAU karena **Aset Sitelink** mengarah ke URL yang salah.
  - **Cek Aset Sitelink (Sangat Krusial):** Jika Final URL sudah benar, periksa ekstensi/aset seperti Sitelink (misal: link "Tentang Kami", "Hubungi", "Koleksi"). Pastikan URL-URL tersebut memang ada di website.
  - **Solusi untuk Website Next.js (Khusus Bahasa Indonesia):** Seringkali Sitelink menggunakan bahasa lokal (misal: `/kontak`, `/kebijakan-pengiriman`), namun routing *real* di Next.js menggunakan bahasa Inggris (`/help`, `/shipping-policy`). Jika ini terjadi, **WAJIB** tambahkan konfigurasi `redirects` (308 Permanent) di `next.config.mjs` agar URL lokal tersebut mengarah ke route asli. Setelah di-deploy, Google Ads akan memvalidasi ulang (atau user bisa klik "Ajukan Banding").
