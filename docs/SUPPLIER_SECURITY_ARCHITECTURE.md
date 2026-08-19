# NINOC Enterprise: Zero-Knowledge Supplier Security Architecture

Dokumen ini menguraikan infrastruktur keamanan tingkat tinggi yang dirancang khusus untuk melindungi privasi, integritas, dan kepercayaan (*trust*) antara NINOC dan para Mitra Pemasok (*Suppliers*). 

Sistem otentikasi ini dibangun dengan arsitektur **Zero-Knowledge Proof** pada level aplikasi, di mana tidak ada satu pun staf NINOC yang mengetahui atau dapat mengakses kata sandi rahasia milik supplier, guna mencegah manipulasi finansial atau pencurian data inventaris.

---

## 🔒 Alur Keamanan (End-to-End Security Flow)

### 1. Onboarding & KYC (Know Your Customer)
- **Proses:** Calon supplier mendaftar melalui halaman *Onboarding* NINOC.
- **Validasi Kredensial:** NINOC mewajibkan penggunaan alamat email berstandar keamanan tinggi (seperti Google Workspace/Gmail) yang aktif dan sah. Email ini adalah jangkar (*anchor*) tunggal identitas supplier di dalam sistem.

### 2. Penyerahan Kunci Gembok Pertama (Initial Access)
- **Tindakan Admin:** Tim Admin NINOC mendaftarkan email resmi supplier tersebut ke dalam *database* Supabase.
- **Kredensial Ganda:** NINOC memberikan **Username** (Email) dan **Password Sementara** (misal: `akses123!`) kepada pihak supplier.
- *Celah Keamanan Sesaat:* Pada tahap ini, karena sandi sementara dibuat oleh NINOC, maka secara teoritis NINOC bisa login sebagai supplier. Inilah yang akan dihancurkan pada Langkah 4.

### 3. Login Perdana & Smart Routing
- Supplier mengakses gerbang universal: `https://ninoc.store/login`.
- Mereka memasukkan email dan sandi sementara. 
- **Smart Routing:** Mesin *backend* NINOC secara cerdas mendeteksi bahwa email tersebut memiliki *role* sebagai `supplier` (bukan admin atau pelanggan biasa), lalu secara otomatis membelokkan rute navigasi menuju Dasbor Rahasia Supplier.

### 4. Penguncian Akses Sepihak (The Security Handshake)
- Setelah berhasil masuk ke Dasbor, sistem mewajibkan supplier untuk mengamankan akunnya melalui menu **Settings > Account**.
- Supplier wajib menekan tombol **"Minta Reset Kata Sandi"** (*Request Password Reset*).
- **Tindakan ini sangat krusial:** Ini adalah titik di mana kontrol diserahkan 100% dari NINOC kepada Supplier.

### 5. Jembatan Enkripsi Silang (Supabase ⇆ Google)
- Tombol *Reset* tidak akan meminta input sandi baru di halaman dasbor. Ini disengaja untuk mencegah *Man-in-the-Middle (MITM) attack* atau sesi yang terbajak jika komputer ditinggalkan terbuka.
- **Supabase Action:** Otak Supabase membuat tautan PKCE (*Proof Key for Code Exchange*) sekali pakai yang sangat rahasia.
- **Pengiriman Terenkripsi:** Tautan PKCE tersebut ditembakkan secara diam-diam (*silent push*) langsung ke kotak masuk Google Workspace milik supplier.

### 6. Validasi Mutlak (Zero-Knowledge Set)
- Supplier membuka email mereka di aplikasi Google.
- Ketika tautan tersebut diklik, peramban (*browser*) akan memvalidasi token kriptografi PKCE ke server Supabase.
- Setelah divalidasi, supplier baru diizinkan untuk mengetikkan **Kata Sandi Pribadi** yang baru.
- **Hashing:** Sandi baru tersebut langsung dihancurkan dan diubah menjadi *Hash* Kriptografi (misal: Algoritma *Bcrypt/Argon2*) oleh *server* sebelum disimpan ke dalam *database*.

---

## 🛡️ Mengapa Arsitektur Ini Disebut "Zero-Knowledge"?
- Setelah Langkah 6 selesai, *hash* sandi di *database* **tidak bisa diubah kembali menjadi teks asli** oleh siapapun.
- Bahkan **Super Admin NINOC** tertinggi (maupun *Database Engineer*) tidak memiliki akses, *tools*, atau algoritma dekripsi untuk melihat sandi supplier tersebut.
- Hal ini memberikan jaminan dan kepercayaan (*trust*) 100% kepada supplier korporat skala besar bahwa inventaris barang, data pencairan dana (*payout*), dan strategi harga mereka tidak bisa disabotase atau dimanipulasi oleh oknum internal.

---

*Disetujui & Diarsiteki untuk NINOC Enterprise (2026)*
