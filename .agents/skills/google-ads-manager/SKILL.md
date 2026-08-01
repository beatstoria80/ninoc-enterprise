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

## 3. Strategi Pengisian URL & Assets
- **URL Spesifik:** Jika mempromosikan satu produk khusus, gunakan URL langsung ke produk tersebut (misal `shopee.co.id/Produk-X`), bukan sekadar beranda toko.
- **AI Generate Assets:** Minta user menekan tombol **Skip** saat Google menawarkan fitur *Generate Assets* menggunakan AI jika link tujuan adalah marketplace. AI Google kesulitan memilah elemen desain marketplace.
- **Manual Copywriting:** Pandu user menulis *Headlines* (Maks 30 huruf) dan *Descriptions* (Maks 90 huruf) secara manual agar tepat sasaran, lengkap dengan *Search themes* (Keyword) yang relevan.

## 4. Strategi Bidding (Penawaran)
- **Bid Strategy:** Pilih **Conversions** (yang dalam kasus marketplace dihitung sebagai *Page views*).
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
