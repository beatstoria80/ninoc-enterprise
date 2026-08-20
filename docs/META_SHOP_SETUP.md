# TODO (Tugas Besok): Setup Meta Facebook & Instagram Shop

*Dokumen ini berisi panduan manual untuk dikerjakan di dalam Dasbor Meta Business Manager.*

Karena semua infrastruktur teknis di website `ninoc.store` sudah selesai (Katalog XML, Pixel, CAPI), langkah selanjutnya dilakukan sepenuhnya di dalam Dasbor Meta Commerce.

---

## 🔑 Prasyarat (Harus disiapkan)
1. Akses Admin ke **Meta Business Manager** (business.facebook.com).
2. Akun Instagram yang sudah diubah menjadi **Akun Bisnis**.
3. **Facebook Page** yang aktif.
4. Keduanya (IG dan FB Page) **sudah dihubungkan** di aplikasi Instagram.

---

## 🛒 Langkah 1: Membuat Katalog Produk (Catalog)
*(Estimasi waktu: 10 Menit)*

1. Buka **Meta Commerce Manager** di: [business.facebook.com/commerce](https://business.facebook.com/commerce/)
2. Klik tombol **"+ Tambahkan Katalog (Add Catalog)"**.
3. Pilih tipe **"E-commerce"** lalu klik **Selanjutnya (Next)**.
4. Pilih **"Unggah Info Produk (Upload Product Info)"** dan Beri nama katalog (contoh: *Katalog Ninoc Store*).
5. Masuk ke katalog tersebut > menu kiri klik **Sumber Data (Data Sources)**.
6. Pilih **"Data Feed"** > **Pembaruan Terjadwal (Scheduled Feed)**.
7. Masukkan **URL Data Feed** kita: `https://ninoc.store/feed/meta.xml`
8. Atur jadwal ke **Harian (Daily)** agar stok selalu sinkron.
9. Pilih mata uang **IDR**.
10. Klik **Simpan & Unggah**. Tunggu hingga Meta selesai menarik data produk.

---

## 🏪 Langkah 2: Menyiapkan Toko (Shop)
*(Estimasi waktu: 15 Menit)*

1. Di **Commerce Manager**, klik menu **"Toko (Shops)"** atau banner **"Buka Toko (Go to Shops)"**.
2. **Pilih Metode Pembayaran:** 
   👉 *Penting:* Pilih **"Checkout on another website"** (Selesaikan pembayaran di situs web lain). Agar pembeli dari Instagram diarahkan ke web `ninoc.store`.
3. **Pilih Saluran Penjualan:** Centang Halaman Facebook dan Profil Instagram.
4. **Hubungkan Katalog:** Pilih "Katalog Ninoc Store" yang dibuat di Langkah 1.
5. Setujui *Seller Agreement* dan selesaikan penyiapan.

---

## ⏳ Langkah 3: Menunggu Peninjauan (Review)
- Meta akan mereview kelayakan akun (biasanya butuh waktu **1-3 hari kerja**).
- Status akan terlihat "Pending" atau "In Review".
- Pastikan website `ninoc.store` memiliki halaman "Return Policy" dan "Privacy Policy" yang jelas (bisa di footer) agar lolos peninjauan Meta.

---

## 🎨 Langkah 4: Tampilan & Tagging
- Jika sudah disetujui, masuk ke Commerce Manager > **Edit Toko (Edit Shop)**.
- Buat *Collections* (Misal: Kemeja Pria, Aksesoris, dll).
- Mulai gunakan fitur **Tag Product** saat posting foto di feed/story Instagram!
