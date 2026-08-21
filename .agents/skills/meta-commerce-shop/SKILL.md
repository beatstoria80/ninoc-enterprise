---
name: meta-commerce-shop
description: "Panduan setup dan konfigurasi Meta Commerce Manager untuk membuat Shop (Toko), menautkan Katalog, serta merutekan transaksi/checkout ke website sendiri berdasarkan studi kasus pembuatan Halaman Facebook baru."
triggers: ["meta commerce", "commerce manager", "meta shop", "facebook shop", "instagram shop", "bikin toko facebook", "bikin toko ig", "hubungkan katalog meta", "setup shop"]
---

# Meta Commerce Manager & Shop Setup Guide

Panduan ini mendokumentasikan langkah-langkah praktis dan penyelesaian masalah (*troubleshooting*) dalam mengatur **Meta Commerce Manager** untuk membuat **Shop** dan menghubungkannya dengan *website* toko online (seperti Ninoc Enterprise). Panduan ini didasarkan pada pengalaman langsung mengatasi kendala izin akses Halaman Facebook.

## 1. Persiapan Awal
Sebelum memulai, pastikan Anda memiliki:
- Akses penuh (*Full Admin Control*) ke Meta Business Manager.
- Domain *website* yang sudah diverifikasi di Meta Business Settings.
- Katalog Produk yang sudah dibuat (misalnya terhubung melalui *Data Feed* XML `meta.xml`).

## 2. Pembuatan Shop (Toko) di Commerce Manager
1. Masuk ke [Meta Commerce Manager](https://business.facebook.com/commerce).
2. Klik tombol **Add Shop** (Tambahkan Toko).
3. **Pilih Metode Checkout**: Pilih opsi **"Checkout on another website"** (Selesaikan Pembelian di Situs Web Lain). Ini penting agar pengunjung Shop diarahkan ke *website* Anda (misalnya `https://ninoc.store`) untuk melakukan transaksi dan pembayaran.

## 3. Penautan Saluran Penjualan (Sales Channels)
Langkah ini sering memunculkan kendala izin (Permission Issues).
- Anda harus memilih Halaman Facebook (Facebook Page) yang akan menaungi Toko ini.

### 🔴 Studi Kasus & Pemecahan Masalah (Troubleshooting)
**Masalah:** Saat memilih Halaman Facebook, muncul *error*: 
> *"You cannot claim this page. You are not an admin on this page or you only have access via an agency."* atau Halaman tidak ditemukan saat dicari.
**Penyebab:** Akun Business Manager Anda tidak memiliki status kepemilikan penuh atau Halaman tersebut diklaim oleh *Business Manager* / Agensi lain, sehingga Anda tidak dapat menggunakannya sebagai entitas *Commerce*.

**Solusi Jitu (Berdasarkan Pengalaman "NINOC STORE"):**
Jika tidak memungkinkan untuk merebut kembali hak akses penuh dari Halaman lama:
1. Buat **Halaman Facebook (Facebook Page) Baru** langsung dari dalam Business Manager atau akun Facebook pribadi Anda (misal: "NINOC STORE").
2. Lengkapi detail halaman baru (Logo, Banner, Deskripsi).
3. Kembali ke alur *Commerce Manager* dan pilih Halaman yang baru saja dibuat tersebut.
4. Hubungkan juga dengan akun Instagram bisnis Anda yang relevan (jika diminta).

## 4. Menghubungkan Katalog Produk (Catalog)
1. Pilih Katalog Produk yang sebelumnya sudah Anda siapkan.
2. Jika Anda membuat dari nol, Anda dapat mengaitkannya dengan *Pixel* Anda atau sumber *Data Feed* (`meta.xml`). 
3. *Website* (Next.js) biasanya menyediakan *feed URL* dinamis yang ditarik (di-fetch) oleh Meta setiap hari untuk memperbarui stok dan harga.

## 5. Pengaturan Pengiriman & Pengembalian (Shipping & Returns)
1. Sesuaikan wilayah pengiriman (misalnya: Indonesia).
2. Masukkan kebijakan pengembalian barang (*Return Policy*) standar toko Anda (contoh: masa retur 7 hari) serta tautan email layanan pelanggan.

## 6. Peninjauan (Review) & Publikasi
1. Periksa kembali semua rincian: Metode Checkout, Halaman Facebook (Saluran Penjualan), dan Katalog.
2. Klik **Submit for Review** (Kirim untuk Peninjauan).
3. Status Toko (Shop) akan berubah menjadi **In Review** (Sedang Ditinjau).
4. Meta biasanya membutuhkan waktu hingga 48 jam untuk menyetujui publikasi Shop. Selama masa tunggu ini, integrasi teknis di sisi web (Pixel, CAPI, XML) bisa tetap berjalan normal.

---

**Catatan Khusus Agen:**
Saat pengguna meminta untuk menautkan/membuat Meta Shop, selalu tanyakan apakah mereka sudah memegang akses Admin Penuh (*Full Admin*) atas Halaman Facebook target. Jika mereka mengalami masalah serupa dengan kepemilikan Agensi, langsung sarankan pembuatan Halaman Facebook baru untuk menghemat waktu dan mencegah jalan buntu (*blocker*).
