# DOKUMENTASI SISTEM & SOP LOGISTIK GUDANG SUPPLIER (NINOC B2B)

Dokumen ini memuat spesifikasi arsitektur integrasi sistem logistik supplier dan Standard Operating Procedure (SOP) untuk staf admin/operator gudang guna mencegah kesalahan operasional serta mengunci celah kecurangan (*manpower fraud*).

---

## BAGIAN 1: ARSITEKTUR & INTEGRASI SISTEM

Sistem logistik supplier NINOC mengadopsi pola **Clean Architecture** berlapis untuk memastikan kestabilan data, keamanan otorisasi, dan performa tinggi saat memproses data dalam jumlah besar.

### 1. Diagram Aliran Data (Data Flow Pipeline)
```
[Client Browser UI]
       │ (Memicu Aksi / Print)
       ▼
[Service Layer: SupplierService.ts]
       │ (Verifikasi Sesi & Aturan Bisnis)
       ▼
[Repository Layer: SupplierRepository.ts]
       │ (Kueri Teroptimasi & Join SQL)
       ▼
[Supabase Database (PostgreSQL)]
```

### 2. Spesifikasi Modul & Lapisan Kode
*   **Domain Layer (`src/domain/supplier/OrderStatus.ts`)**:
    *   Mendefinisikan *enum* status pesanan standard (`paid`, `pending_packing`, `ready_for_pickup`, `shipped`, `delivered`, dll.).
    *   Menghilangkan penggunaan *magic strings* di seluruh aplikasi guna mencegah ketidakcocokan data.
*   **Repository Layer (`src/repositories/SupplierRepository.ts`)**:
    *   Mengisolasi kueri Supabase ke satu titik.
    *   Menghitung jumlah item fisik pesanan secara akurat menggunakan agregasi `reduce(item.quantity)` langsung pada level *data-fetch*, menggantikan deduplikasi memori JS yang boros CPU.
    *   **In-Memory Split-Join**: Memetakan gambar produk (`image_url`) dengan cara menanyakan data produk secara terpisah setelah `orders` didapatkan. Langkah ini menghilangkan ketergantungan relasi *foreign key* bersarang di Supabase yang sering memicu error crash database `PGRST200` pada PostgREST.
*   **Service Layer (`src/lib/services/SupplierService.ts`)**:
    *   Membungkus proses otentikasi supplier (`getCurrentSupplierContext()`) dan mengelola kueri logistik terintegrasi dengan client admin (`supabaseAdmin`) untuk melewati batasan otorisasi RLS pada data relasi internal.
*   **Standard Shipping Label Component (`src/components/admin/ShippingLabel.tsx`)**:
    *   Mengintegrasikan komponen label thermal standard ukuran **100mm × 150mm** yang sama dengan dashboard admin.
    *   Mendukung parameter `senderOverride` untuk memetakan alamat asal pengiriman (*origin*) ke gudang supplier Biteship Multichannel yang aktif secara dinamis.
*   **UI & Full-Row Navigation (`src/app/supplier/(dashboard)/logistics/LogisticsTableClient.tsx`)**:
    *   **Navigasi Penuh**: Mengaktifkan interaksi klik pada seluruh baris tabel (`<tr>`) menggunakan hook Next.js `useRouter` untuk memudahkan staf gudang masuk ke detail pesanan secara instan tanpa terbatas pada ikon tombol kecil.
    *   **Rincian Kuantitas & Foto**: Menampilkan informasi visual thumbnail gambar produk dan detail SKU/Varian langsung di baris tabel logistik utama untuk transparansi administratif.
*   **Otorisasi Halaman Detail (`src/app/supplier/(dashboard)/logistics/[orderId]/page.tsx`)**:
    *   Menggunakan `supabaseAdmin` untuk bypass batasan RLS default yang mengunci tabel `orders`.
    *   Menerapkan validasi kepemilikan ketat: sistem hanya mengizinkan pemuatan halaman detail jika pesanan tersebut mengandung minimal 1 produk milik `supplier_id` terkait. Kueri nama produk juga langsung menggunakan kolom `product_name` bawaan dari tabel `order_items` untuk keamanan mutlak tanpa join rawan eror.

---

## BAGIAN 2: PROTOKOL KEAMANAN & MITIGASI FRAUD (ANTI-REPRINT)

Untuk mencegah kebocoran barang atau manipulasi resi oleh oknum staf gudang (*manpower fraud*), sistem dilengkapi dengan fitur keamanan **Print Audit Trail & Watermarking**:

### 1. Alur Kerja Deteksi Cetak Ulang
```
[Klik Tombol Print] ──> [Sistem Update print_count +1 & Catat Email Admin]
                              │
                              ├──> [print_count === 1] ──> Cetak Label Bersih (Normal)
                              │
                              └──> [print_count > 1]   ──> Tempel Watermark "DUPLICATE / REPRINT"
```

### 2. Mekanisme Proteksi di Kode Program
*   **Pembaruan Status Cetak**: Ketika tombol "Print All Labels" ditekan, fungsi `handlePrint` di `PrintPackingSlipsModal.tsx` secara serial menginstruksikan database untuk meningkatkan nilai `print_count`, merekam email operator (`last_printed_by`), dan memperbarui tanggal cetak (`last_printed_at`).
*   **Watermark Fisik**: Komponen `<ShippingLabel />` mendeteksi jika `order.print_count > 0` dan otomatis merender elemen overlay bertuliskan **`DUPLICATE / REPRINT`** miring diagonal dengan tinta merah transparan yang memuat nama admin pencetak.
*   **Peringatan Visual (UI)**: Halaman pratinjau modal akan menampilkan lencana berkedip merah (**`REPRINT Xx`**) sebagai indikator bahwa dokumen ini sudah pernah dicetak sebelumnya.

---

## BAGIAN 3: SOP OPERASIONAL GUDANG SUPPLIER

Prosedur ini wajib diikuti oleh seluruh Operator Gudang, Admin Logistik, dan Petugas Keamanan Gerbang.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ALUR UTAMA OPERASIONAL GUDANG                        │
│                                                                         │
│ 1. Filter Tab ──> 2. Siapkan Barang ──> 3. Cetak Resi ──> 4. Serah Terima │
│   "To Pack"         (QC & Packing)        (Thermal)        (Scan Driver)│
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Tahap Persiapan & Packing (QC)
1.  Buka Dashboard Supplier pada menu **Logistics & Packing**.
2.  Pilih tab **Action Required (To Pack)** untuk melihat daftar pesanan yang telah lunas dan siap dikemas.
3.  Klik pada baris pesanan untuk membuka detail barang di laci kanan (*Drawer detail*).
4.  Ambil produk dari rak sesuai dengan **Ukuran (Size)** dan **Warna (Color)** yang tertera.
5.  Lakukan pemeriksaan kualitas fisik (*Quality Control*) untuk memastikan barang tidak cacat.
6.  Kemas produk ke dalam plastik/kotak kemasan NINOC dengan rapi.

### 2. Tahap Pencetakan Resi (Label Thermal)
1.  Pada halaman **Logistics & Packing**, klik tombol **Print Packing Slips** di kanan atas.
2.  Pastikan printer thermal Anda telah terisi kertas label ukuran **100mm × 150mm**.
3.  Tinjau pratinjau stiker resi pada layar. Perhatikan jika ada tanda peringatan merah **`REPRINT`**.
4.  Klik **Print All Labels**. Sistem akan mengirimkan dokumen cetak ke printer Anda secara berurutan.
5.  Sobek stiker resi dan tempelkan dengan rata pada bagian luar permukaan paket pembeli.

### 3. Protokol Penanganan Cetak Ulang (Reprint Protocol)
Cetak ulang resi hanya diperbolehkan jika stiker pertama **rusak fisik, robek, atau tinta printer buram/habis**.
1.  Jika resi harus dicetak kembali, laporkan ke supervisor gudang untuk mencatat alasan cetak ulang.
2.  Saat resi dicetak untuk kedua kalinya, resi stiker akan memiliki watermark merah diagonal bertuliskan **`DUPLICATE / REPRINT`**.
3.  **DILARANG KERAS** menempelkan resi berwatermark *Duplicate/Reprint* pada paket baru yang belum terverifikasi. Resi duplikat hanya boleh ditempelkan pada paket asli yang label pertamanya rusak.
4.  Hancurkan label lama yang rusak menggunakan penghancur kertas (*paper shredder*) atau gunting guna menghindari penyalahgunaan label bekas.

### 4. Protokol Keamanan Pintu Gerbang Gudang (Security Gate SOP)
Setiap petugas keamanan yang memproses serah terima paket ke kurir ekspedisi (Grab/Gojek/J&T/Sicepat) wajib memeriksa hal berikut:
1.  **Verifikasi Label Fisik**: Periksa apakah ada stiker paket yang ber-watermark **`DUPLICATE / REPRINT`**.
2.  **Pemeriksaan Manifes**: Jika ada label bertanda *Reprint*, periksa nomor ID Pesanan (*Order ID*) pada komputer admin. Pastikan tidak ada pengiriman ganda (2 paket fisik berbeda dengan resi nomor pelacakan yang sama).
3.  **Tindakan Penahanan**: Jika ditemukan dua paket fisik menggunakan nomor resi yang sama, tahan paket tersebut dan segera laporkan ke Manajer Gudang sebagai indikasi kecurangan internal (*inventory theft*).
