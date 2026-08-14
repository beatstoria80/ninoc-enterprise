# Panduan CS & FAQ Logistik NINOC Enterprise

Dokumen ini disusun sebagai panduan bagi tim *Customer Service* (CS), operasional, dan admin NINOC untuk merespons pertanyaan atau keluhan pelanggan terkait tarif pengiriman, estimasi waktu sampai, serta aturan pemisahan gudang (*multi-warehouse*).

---

## 1. Panduan Menjawab Pertanyaan Tarif Pengiriman (JNE vs Ekspedisi Lain)

### **Kasus: "Kenapa JNE Reguler lebih mahal dibanding SiCepat/J&T, padahal durasinya sama atau lebih lambat?"**

#### **Penjelasan Internal untuk CS:**
* **Kebijakan Tarif Resmi:** Semua data tarif di checkout ditarik secara *real-time* dari server Biteship API yang terhubung langsung dengan tarif resmi ekspedisi. Perbedaan harga murni berasal dari kebijakan internal masing-masing kurir, bukan manipulasi sistem NINOC.
* **Jaringan vs Efisiensi:** JNE memiliki infrastruktur nasional yang sangat besar yang membutuhkan biaya pemeliharaan tinggi, sehingga tarif regional (antar-kabupaten/kecamatan) seringkali lebih tinggi dibanding kurir generasi baru seperti SiCepat atau J&T yang menawarkan harga *flat* regional Jawa Barat.

#### **Draf Template Balasan ke Pelanggan (Copy-Paste):**
> *"Halo Kak [Nama Pelanggan], terima kasih telah menghubungi kami. Terkait tarif pengiriman, sistem kami terintegrasi secara langsung dengan server ekspedisi pihak ketiga (Biteship) untuk menampilkan tarif resmi dan ter-update secara real-time.*
>
> *Perbedaan tarif tersebut murni merupakan kebijakan resmi dari masing-masing pihak ekspedisi (JNE, SiCepat, atau J&T). JNE Reguler untuk beberapa rute kecamatan memang menerapkan tarif standar operasional mereka, sementara SiCepat dan J&T menawarkan opsi tarif hemat regional khusus.*
>
> *Kakak dibebaskan sepenuhnya untuk memilih opsi kurir yang paling hemat dan cepat sesuai kenyamanan Kakak saat checkout. Ada hal lain yang bisa kami bantu?"*

---

## 2. Panduan Menjawab Pertanyaan Estimasi Waktu Pengiriman

### **Kasus: "Kenapa estimasi pengiriman JNE lebih lama (3-6 hari) sedangkan SiCepat/J&T hanya 1-2 hari?"**

#### **Penjelasan Internal untuk CS:**
* **Sistem Sortir (Routing):** JNE menggunakan model distribusi *Hub-and-Spoke* (paket harus dikumpulkan di Gudang Utama/Hub Regional besar terlebih dahulu sebelum disortir ke agen tujuan). Hal ini memakan waktu ekstra jika alamat tujuan berada di luar kota besar.
* **Point-to-Point Regional:** SiCepat dan J&T memiliki jalur logistik *point-to-point* yang sangat efisien untuk pengiriman wilayah regional se-Jawa Barat, sehingga paket bisa langsung dikirim ke kota tujuan tanpa singgah lama di hub transit.

#### **Draf Template Balasan ke Pelanggan (Copy-Paste):**
> *"Halo Kak, betul sekali. Setiap ekspedisi memiliki jalur pengiriman (*routing*) yang berbeda.* 
>
> *SiCepat dan J&T memiliki sistem sortir langsung antar-titik wilayah Jawa Barat yang membuat durasi pengiriman menjadi lebih cepat (rata-rata 1-2 hari kerja).* 
>
> *Sedangkan JNE menggunakan sistem transit gudang utama regional terlebih dahulu, sehingga membutuhkan waktu estimasi 3-5 hari kerja untuk rute tertentu.*
>
> *Jika Kakak membutuhkan paket tiba lebih cepat dengan biaya lebih ekonomis, kami sangat menyarankan memilih opsi SiCepat atau J&T saat checkout ya Kak."*

---

## 3. Panduan Aturan Pemisahan Gudang (Multi-Warehouse)

### **Kasus: "Kenapa saya tidak bisa menggabungkan barang A dan barang B dalam satu keranjang/pembayaran?"**

#### **Penjelasan Internal untuk CS:**
* **Lokasi Fisik Berbeda:** Produk NINOC disimpan di beberapa gudang/fasilitas produksi yang lokasinya berjauhan (beda kota/provinsi).
* **Kendala Pick-up Kurir:** Kurir logistik tidak bisa menjemput satu paket di dua alamat yang berbeda. Jika dipaksakan dalam satu checkout, sistem pengiriman otomatis akan error karena koordinat *pickup* tidak bisa dibagi dua.
* **Solusi Pelanggan:** Pelanggan harus melakukan *checkout* terpisah (membayar ongkir masing-masing) agar kurir lokal dari tiap gudang dapat menjemput barang secara akurat ke alamat mereka.

#### **Draf Template Balasan ke Pelanggan (Copy-Paste):**
> *"Halo Kak, mohon maaf atas ketidaknyamanan yang dialami. Hal tersebut terjadi karena produk-produk yang Kakak pilih berada di lokasi fasilitas/gudang produksi kami yang berbeda.*
>
> *Demi memastikan kurir ekspedisi dapat menjemput dan mengirimkan setiap barang dengan aman langsung dari lokasi asal barang, sistem kami memisahkan pengirimannya secara otomatis.*
>
> *Kakak dapat menyelesaikan pesanan produk pertama terlebih dahulu, kemudian melakukan checkout terpisah untuk produk selanjutnya. Terima kasih banyak atas pengertiannya ya Kak."*

---

## 4. Ringkasan Teknis untuk Admin & Tim Operasional

| Komponen | Penjelasan Teknis | Tindakan Jika Terjadi Error |
|---|---|---|
| **API Rates** | `/api/biteship/rates` mengambil tarif live dari Biteship. | Cek status saldo Biteship atau validasi API Key di `.env` jika tarif gagal dimuat sama sekali. |
| **Integrasi Gudang** | Setiap produk terikat ke `warehouse_id` di database Supabase. | Pastikan setiap produk baru yang di-input admin sudah dipilihkan Warehouse yang benar agar koordinat ongkir akurat. |
| **SLA Instant/Sameday** | Pesanan Instant/Sameday setelah pukul 15:00 WIB otomatis diberi peringatan dikirim besok. | Informasikan ke pelanggan bahwa batas penjemputan *driver* ojek online diatur ketat oleh sistem Biteship hingga pukul 15:00 WIB. |
