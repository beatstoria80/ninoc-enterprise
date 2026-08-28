# Panduan Penggunaan Dasbor Vendor (Supplier Journey)
**Khusus untuk Mitra Strategis: PT Tairflask Indonesia Utama**

Dokumen ini menjelaskan alur (*journey*) tim operasional dan tim gudang Tairflask saat menggunakan ekosistem *Multi-Vendor* di platform **ninoc.store**. Fitur ini dirancang sangat efisien dan otomatis tanpa membebani pekerjaan administratif rutin.

---

## 1. Akses Masuk (Login) yang Terlindungi
**Tim operasional Tairflask akan diberikan portal masuk (login) yang sepenuhnya terpisah dari pelanggan.**

* **Cara Penggunaan:** Tim Anda cukup masuk menggunakan *email* dan *password* resmi yang telah didaftarkan (misal: `audit_it@ninoc.store`) melalui tautan aman kami di `https://ninoc.store/login`.
* **Fungsi Utama:** Mencegah akses tidak sah ke data inventaris dan pesanan toko resmi Anda.

> `[PLACEHOLDER GAMBAR: Screenshot halaman Login khusus Supplier di website ninoc.store]`

---

## 2. Pemantauan Pesanan Masuk (Real-Time Order)
**Pesanan yang masuk ke dasbor ini 100% dipastikan telah dibayar lunas oleh konsumen melalui payment gateway kami.**

* **Cara Penggunaan:** Masuk ke menu **"Logistics & Packing"** di *sidebar* kiri. Di halaman *Logistics Command* ini, Anda akan melihat antrean pesanan yang siap dikirim.
* **Proteksi Data Konsumen (Masking):** Sesuai perjanjian keamanan aset digital, kami menyensor (masking) data sensitif seperti *email* dan *nomor telepon asli* pembeli.
* **Informasi Tersedia:** Anda hanya akan melihat **Nama Penerima**, **Alamat Lengkap Logistik**, dan **Varian Produk** untuk keperluan operasional.

> `[PLACEHOLDER GAMBAR: Screenshot halaman "Logistics & Packing" di dasbor vendor]`

---

## 3. Eksekusi Pengemasan & Cetak Resi Otomatis
**Tairflask tidak perlu pusing mengurus pembayaran kurir karena semua ongkos kirim (Biteship) telah diselesaikan oleh konsumen di ninoc.store.**

* **Cara Penggunaan:** 
   1. Buka rincian pesanan yang masuk di menu *Logistics & Packing*.
   2. Klik tombol **Scan to Dispatch** atau tombol cetak resi yang tersedia.
   3. Sistem (via API Biteship) akan otomatis menghasilkan kode *booking* atau nomor resi resmi dari kurir yang dipilih konsumen.
* **Langkah Akhir:** Tempelkan resi tersebut pada paket, dan tunggu kurir melakukan penjemputan (*Pick-Up*) di gudang Anda dalam waktu maksimal 1x24 jam.

> `[PLACEHOLDER GAMBAR: Screenshot detail pesanan jika ada pesanan masuk, atau biarkan menggunakan gambar Logistics Command secara umum]`

---

## 4. Pembaruan Stok & Kebijakan Harga (Price Parity)
**Tairflask memiliki kendali penuh atas produk yang tayang tanpa campur tangan admin ninoc.**

* **Cara Penggunaan:** Pada menu **"Allocations"**, tim Anda dapat memantau sisa stok dan menyesuaikan harga jual agar selalu sama (*Price Parity*) dengan toko *Official Store* Anda di platform lain.
* **Fitur Utama:** Jika Anda mengadakan diskon di Shopee, Anda cukup mengatur harga di menu *Allocations* ini secara mandiri, maka harga di etalase pembeli ninoc.store akan langsung berubah secara *real-time*.

> `[PLACEHOLDER GAMBAR: Screenshot halaman "Allocations" di mana vendor mengatur Harga dan Stok]`

---

## 5. Ringkasan Keuangan & Pencairan (Sales & Payouts)
**Transparansi total atas pendapatan bersih yang menjadi hak Tairflask.**

* **Cara Penggunaan:** Masuk ke menu **"Sales & Payouts"**. Sistem kami secara cerdas memisahkan antara *Harga Jual Retail* dengan *Potongan Komisi (7% atau 10%)* sesuai kontrak.
* **Fitur Utama:** Anda bisa melihat total uang yang siap ditransfer (dicairkan) ke rekening perusahaan Anda secara berkala pada setiap hari Jumat. Tidak perlu ada proses penagihan (*invoice*) manual, karena riwayat pergerakan dana sudah terangkum rapi.

> `[PLACEHOLDER GAMBAR: Screenshot halaman "Sales & Payouts" yang menampilkan Saldo (Balance) dan Riwayat Pencairan]`
