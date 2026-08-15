# 📋 Standard Operating Procedure (SOP) - Admin Ninoc Enterprise

Dokumen ini adalah panduan operasional standar (SOP) bagi Staf Admin & Logistik dalam menggunakan sistem Admin Dashboard Ninoc Enterprise untuk memproses pesanan dan mengelola toko.

---

## 1. SOP Pemrosesan Pesanan (Fulfillment)

Setiap harinya, tugas utama Admin adalah memastikan pesanan yang telah dibayar (*Paid*) segera diproses dan dikirimkan ke pihak logistik.

### Langkah 1: Mencetak Resi Pengiriman (Order Tab)
1. Buka menu **Pesanan (Orders)** dari bilah navigasi kiri.
2. Gunakan *Filter Status* di bagian atas dan pilih **Lunas (Paid)**.
3. Anda dapat mencetak pesanan secara individu maupun massal:
   - **Cetak Massal:** Klik tombol ikon **Printer** di sudut kanan atas tabel.
   - **Cetak Individu:** Klik pesanan yang diinginkan untuk membuka rincian, lalu klik tombol **Cetak Label**.
4. Sebuah jendela baru (*Pop-up*) akan terbuka menampilkan label pengiriman ber-barcode. (Pastikan *Pop-up Blocker* di *browser* Anda dimatikan).
5. Segera tempelkan resi pada paket fisik.
6. **Perhatian (Anti-Fraud):** Jika sistem mendeteksi Anda mencoba mencetak resi untuk pesanan yang sudah *Shipped*, sistem akan memunculkan Peringatan Merah (*Fraud Warning*).

### Langkah 2: Mengirim / Request Pickup (Logistics Tab)
*Setelah semua paket ditempeli resi dan siap, langkah selanjutnya adalah memesan kurir ekspedisi (Biteship).*

1. Bawa semua paket yang siap kirim, dan buka menu **Logistik (Logistics)**.
2. Tersedia dua opsi untuk memproses pengiriman:
   - **Cara Manual:** Cari pesanan di tabel (Filter: Paid), lalu klik tombol **Panggil Kurir (Request Pickup)**.
   - **Cara Cepat (Scanner):** Klik ikon **Scan Barcode**, arahkan kursor ke kolom input, lalu *tembak* barcode di paket menggunakan alat pemindai fisik.
3. Sistem akan memanggil kurir secara otomatis via Biteship, dan status pesanan akan langsung berubah menjadi **Dikirim (Shipped)**.
4. Nomor Resi Asli (*Tracking ID / Waybill*) akan otomatis tertanam ke dalam database.

---

## 2. SOP Manajemen Katalog & Inventaris

### Menambah atau Mengedit Produk
1. Buka menu **Produk (Products)**.
2. Klik tombol **Tambah Produk (Add Product)** atau klik ikon Edit pada produk yang sudah ada.
3. Isi kolom Nama, Kategori, Harga, dan Varian (Warna/Ukuran).
4. **Penting:** Pastikan Anda mengisi **Harga Modal (Supplier Cost)** dengan akurat pada tab *Costing*. Sistem mengandalkan nilai ini untuk menghitung *Profit & Loss* secara otomatis.
5. Klik **Save**.

### Stok Opname (Penyesuaian Fisik)
Jika ada ketidaksesuaian antara stok di rak fisik dan di sistem (misal: barang hilang/rusak):
1. Buka menu **Stock Opname**.
2. Pilih produk dan varian yang akan disesuaikan.
3. Masukkan jumlah stok fisik sebenarnya (Sistem akan otomatis menghitung surplus/defisit).
4. Tambahkan catatan (contoh: "Barang reject produksi") lalu simpan.

---

## 3. SOP Penanganan Pelanggan (CRM)

### Membalas Tiket Bantuan (Customer Support)
1. Perhatikan *Badge Merah* pada menu **Pesan (Messages)**. Ini menandakan ada pesan belum dibaca.
2. Buka menu tersebut, klik percakapan di kolom kiri.
3. Ketik balasan Anda dan tekan **Kirim**. Pelanggan akan mendapatkan notifikasi langsung.
4. Ubah status tiket menjadi **Closed** jika masalah sudah terselesaikan agar antrean tidak menumpuk.

### Mengurus Permintaan Retur (Refund/Exchange)
1. Buka menu **Retur (Returns)**.
2. Tinjau foto bukti kerusakan atau alasan yang dikirimkan pelanggan.
3. Jika disetujui, klik **Approve**. (Admin finansial nantinya perlu menindaklanjuti proses transfer dana).
4. Jika ditolak, klik **Reject** dan sertakan alasan penolakan secara sopan.

---

## 💡 Troubleshooting & Bantuan Cepat
- **Halaman Terasa Lambat?** Sistem ini dilengkapi dengan pembaruan otomatis instan (*Optimistic Updates*). Jika Anda merasa ada data yang janggal (misal ada dua administrator yang bekerja bersamaan), Anda dapat me- *refresh* halaman browser (F5) untuk menyinkronkan data terakhir dari server.
- **Kesalahan Harga Promosi?** Jika ada komplain mengenai harga yang tidak sesuai, periksa ketersediaan voucher di menu Pengaturan / Promosi. Sistem selalu menvalidasi ulang kode voucher di *database* pusat.
