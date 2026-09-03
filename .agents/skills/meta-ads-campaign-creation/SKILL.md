---
name: meta-ads-campaign-creation
description: Panduan Definitif dan Flow Pemecahan Masalah (Troubleshooting) untuk Pembuatan Kampanye Meta Ads E-Commerce. Fokus pada setup Pixel, penanganan error "Toko", dan publikasi iklan.
---

# Meta Ads Campaign Creation & Troubleshooting Guide

Panduan ini mendokumentasikan prosedur standar dan *edge-cases* yang terjadi selama proses pembuatan kampanye iklan Meta (Facebook/Instagram Ads) untuk proyek `ninoc-enterprise`. 

> [!IMPORTANT]
> Untuk masalah izin tingkat lanjut seperti Error (#200) Permission Denied, pembuatan Akun Iklan baru di Business Manager, dan pengaturan hierarki Pixel ke Akun Iklan, wajib merujuk pada skill baru: [meta-ads-troubleshooting](file:///d:/ninoc-enterprise/.agents/skills/meta-ads-troubleshooting/SKILL.md).

Agen harus merujuk pada dokumen ini saat memandu pengguna meluncurkan iklan baru agar terhindar dari *error* umum Meta.

## 1. Strategi Pembuatan Meta Pixel (Set Data)
Jangan menyarankan pembuatan Pixel melalui **Business Settings** jika pengguna sedang berada di tengah proses pembuatan iklan di **Ads Manager**, karena sering terjadi masalah sinkronisasi *Ad Account* (Pixel tidak muncul).
- **Golden Rule:** Arahkan pengguna untuk mengklik tombol **"Buat set data" (Create Dataset/Pixel)** yang muncul langsung di *pop-up* halaman Ads Manager (Level Set Iklan).
- Pixel yang dibuat dari *pop-up* ini akan 100% otomatis tertaut ke Akun Iklan yang sedang aktif tanpa *error* izin.
- Setelah Pixel dibuat, minta ID Pixel tersebut kepada pengguna.
- Perbarui `NEXT_PUBLIC_META_PIXEL_ID` di file lokal `.env.local` dan ingatkan pengguna untuk memperbaruinya di Dasbor Vercel (sebagai tipe **Config**, BUKAN **Secret**) lalu lakukan **Redeploy**.

## 2. Mengatasi Hilangnya Kolom Meta Pixel di Set Iklan
Jika pengguna melaporkan bahwa blok "Set data" atau "Peristiwa Konversi" hilang/tidak muncul:
- **Penyebab:** *Target Kinerja* (Performance Goal) secara tidak sengaja terubah menjadi "Maksimalkan jumlah tayangan halaman tujuan" (Maximize landing page views).
- **Solusi:** Instruksikan pengguna untuk mengubah *Target Kinerja* kembali menjadi **"Maksimalkan jumlah konversi" (Maximize number of conversions)**. Kolom Pixel akan otomatis muncul kembali.

## 3. Error: "Tidak bisa mengarahkan orang ke toko Anda"
Jika pengguna mendapati peringatan kuning terkait Toko (Shop) tidak tersedia di lokasi audiens:
- **Penyebab:** Opsi "Destinasi yang dipersonalisasi" mencoba mengarahkan pengguna ke Katalog Toko Instagram native yang tidak di- *support* atau bermasalah di wilayah tersebut.
- **Solusi:** 
  1. Klik "Edit" pada kotak *Destinasi yang dipersonalisasi*.
  2. Matikan (ubah jadi abu-abu) sakelar **Toko (Shop)**.
  3. Pastikan HANYA opsi **Optimalkan destinasi situs web** yang menyala.

## 4. Error Merah: "URL Tautan di Materi Iklan Tidak Ada"
Jika iklan ditolak (gagal *Publish*) dengan keterangan URL tautan hilang:
- **Penyebab:** Mematikan sakelar "Toko" sering kali me- *reset* (menghapus) URL yang sudah diketik sebelumnya.
- **Solusi:** Arahkan pengguna ke bagian **Destinasi** di level Iklan, lalu isi kembali kotak **URL Situs Web** dengan alamat utama (misal: `https://ninoc.store`).

## 5. Error Merah: "Perlu nomor WhatsApp"
- **Penyebab:** Algoritma Meta mengira iklan ini bertujuan mendatangkan *chat* (Pesan).
- **Solusi:** Di bagian **Ajakan Bertindak (Call to Action)**, pastikan pilihannya adalah **Belanja sekarang (Shop Now)** dan BUKAN "Kirim Pesan WhatsApp". Pastikan URL situs web sudah terisi.

## 6. Error Merah: "Gambar Tidak Ditemukan (#2446386)"
Jika materi iklan memunculkan error *Gambar Tidak Ditemukan* di atas jendela pratinjau:
- **Penyebab:** Ada media (gambar/video) yang *corrupt*, terhapus, atau tersisa sebagai *placeholder* dari katalog lama.
- **Solusi:**
  1. Gulir ke bagian **Materi Iklan > Media**.
  2. Klik ikon **Tempat Sampah** (Hapus Semua Media) untuk membersihkan *cache* media yang rusak.
  3. Klik **Tambahkan Media** > **Tambahkan Video/Gambar** dan pilih ulang video yang benar.

## 7. Peringatan Kuning (Abaikan)
- **Meta Pixel Anda Tidak Aktif (Titik Merah):** Ini 100% normal untuk Pixel yang baru berumur beberapa menit dan belum menerima trafik. Abaikan dan tetap klik **Terbitkan**. Begitu ada *visitor* pertama, titik akan berubah hijau (Aktif).
- **Parameter URL (Opsional):** Jika pengguna bingung, beri kode standar ini: `utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`.

## 8. Error Saat Terbitkan: "Siapkan untuk menayangkan iklan"
- Jika setelah klik Terbitkan pengguna dilempar ke halaman bergambar Kaca Pembesar (Account Overview):
- **Penyebab:** Akun iklan belum memiliki metode pembayaran aktif atau belum menyetujui kebijakan Meta.
- **Solusi:** Arahkan pengguna untuk mengklik **Buka Gambaran Umum Akun**, lalu klik Tambahkan Metode Pembayaran. Jika saldo prabayar sudah ada (misal: Dana Tersedia Rp 88.800), mereka hanya perlu menyelesaikan *checklist* konfirmasi di halaman tersebut.
