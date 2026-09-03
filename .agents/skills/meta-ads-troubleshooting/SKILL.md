---
name: meta-ads-troubleshooting
description: "Panduan pemecahan masalah (troubleshooting) tingkat lanjut untuk integrasi Meta Ads, error izin token (#200), dan standar setup Kampanye Konversi E-commerce."
triggers: ["error 200 meta", "ads_management permission", "dashboard meta error", "pixel tidak aktif", "setup kampanye konversi", "target kinerja"]
---

# Meta Ads Setup & Troubleshooting Guide

Skill ini berisi dokumentasi pemecahan masalah kritis yang sering terjadi saat mengintegrasikan Meta Ads (Facebook/Instagram) dengan dasbor analitik kustom dan saat mengatur kampanye iklan pertama untuk E-commerce.

## 1. Pemecahan Masalah: Error (#200) Permission Denied
**Gejala:** Dasbor web gagal menarik data dari Meta API dan mengembalikan error: `(#200) Ad account owner has NOT grant ads_management or ads_read permission`.
**Penyebab Root:** Token API (System User/Admin) yang terpasang di `.env` (misal: `META_AD_ACCOUNT_ID` atau `META_ACCESS_TOKEN`) tidak memiliki hak akses ke Akun Iklan, ATAU Akun Iklan yang digunakan adalah Akun Iklan Personal yang tidak bisa ditambahkan ke Business Manager karena belum ada riwayat pembayaran.

**Solusi Paling Andal (Production Grade):**
Jangan gunakan Akun Iklan Personal. Buat Akun Iklan baru khusus di dalam Business Manager.
1. Buka **Meta Business Settings > Akun > Akun Iklan**.
2. Klik **Tambahkan > Buat Akun Iklan Baru** (Pilih mata uang IDR dan zona waktu Asia/Jakarta).
3. Setelah terbuat, tetapkan Izin (Assign Assets): Berikan akses **Kelola Kampanye** dan **Lihat Kinerja** kepada Admin dan **System User** (sangat penting untuk integrasi API).
4. Ambil ID Akun Iklan yang baru, lalu perbarui `META_AD_ACCOUNT_ID` di environment Vercel dan lakukan *Redeploy*.

## 2. Pemecahan Masalah: Pixel "Tidak Aktif" di Level Iklan
**Gejala:** Saat membuat iklan Konversi, Pixel tidak bisa dipilih atau ada peringatan "Meta Pixel Anda Tidak Aktif / Siapkan Peristiwa Konversi", padahal status Pixel di Pengelola Peristiwa sudah hijau.
**Penyebab Root:** Pixel (Set Data) adalah aset terpisah dari Akun Iklan. Jika Akun Iklan baru dibuat, Pixel lama belum terhubung ke akun tersebut.

**Solusi:**
1. Buka **Meta Business Settings > Sumber Data > Set Data (Pixel)**.
2. Tab **Orang**: Klik "Tetapkan Orang", lalu tambahkan Admin dan **System User (Penting untuk Conversions API / CAPI)** dengan akses Kontrol Penuh.
3. Tab **Aset Terhubung**: Klik "Tambahkan Aset", lalu pilih Akun Iklan Baru yang dibuat pada tahap 1.
4. *Catatan:* Peringatan kuning "Siapkan peristiwa konversi" pada tahap pembuatan iklan adalah *false alarm* (normal) untuk akun baru. Abaikan dan tetap lanjutkan publikasi iklan. Peringatan akan hilang setelah pembelian pertama terjadi.

## 3. Standar Setup Kampanye Konversi (E-Commerce/Fashion)
Jangan biarkan sistem Meta mengatur secara membabi-buta. Ikuti standar ini untuk mencegah pemborosan anggaran (burning money):

- **Level Kampanye:**
  - **Anggaran (CBO/Advantage+):** Aktifkan. Set minimal Rp 50.000/hari agar algoritma Pixel bisa masuk fase pembelajaran (Learning Phase).

- **Level Set Iklan (Ad Set):**
  - **Target Kinerja (KRITIS!):** WAJIB diubah dari "Tayangan halaman tujuan" menjadi **"Maksimalkan jumlah konversi"** (Maximize number of conversions). Jika salah, iklan hanya mendatangkan klik murah tanpa penjualan.
  - **Peristiwa Konversi:** Pilih **Pembelian** (Purchase).
  - **Audiens (Strategi Broad):** Untuk produk massal (baju/fashion), gunakan Broad Targeting. Cukup batasi Umur (misal 18-35) dan Lokasi (Indonesia). Biarkan algoritma mencari pembeli tanpa perlu memasukkan "Minat/Interest" secara manual.
  - **Penempatan:** Gunakan **Advantage+ Placements** (Otomatis).

- **Level Iklan (Ad Creative):**
  - Jangan gunakan "Katalog Advantage+" jika hanya ingin mengiklankan satu produk spesifik. Gunakan unggah manual (Video/Gambar).
  - **URL Situs Web (KRITIS!):** Selalu arahkan tautan (Link) langsung ke halaman spesifik produk (Product Page), bukan ke Homepage, agar mengurangi hambatan pembeli (friction).
  - Copywriting harus natural, menyebutkan pain-points (contoh: gerah, sablon luntur), dan menghindari bahasa robot (AI Slop).

## Instruksi untuk Agent
Jika pengguna melaporkan masalah pada dasbor analitik Meta atau meminta bantuan setup iklan, selalu rujuk dokumen ini untuk memastikan hierarki aset (Admin -> System User -> Pixel -> Ad Account) sudah terangkai dengan benar sebelum mencoba melakukan *debugging* pada kode TypeScript.
