# Enterprise Backend Boilerplate Guide (Bahasa Indonesia)

Dokumen ini menjelaskan struktur arsitektur "Clean Architecture" yang diimplementasikan dalam proyek backend Node.js (TypeScript) ini. Sistem ini dirancang untuk kepatuhan **UU PDP Indonesia** dan standar keamanan tingkat enterprise.

---

## 📂 Struktur Folder (Clean Architecture)

Arsitektur ini memisahkan logika bisnis dari detail teknis (database/API).

```text
/src/server
├── core               # Inti Bisnis (Enterprise Layer)
│   └── entities       # Definisi Tabel & Logika Enkripsi (Data Masking)
├── infrastructure      # Detail Teknis (Infrastructure Layer)
│   ├── database       # Konfigurasi Koneksi (TypeORM)
│   ├── security       # Helper Keamanan (AES-256-GCM, Argon2id)
│   └── repositories   # Implementasi Database (Repository Pattern)
└── controllers        # Interface API (Optional - Dalam proyek ini di server.ts)
```

---

## 🛡️ Fitur Keamanan Keamanan Utama

### 1. Enkripsi Data Sensitif (PII)
Menggunakan **AES-256-GCM** via `crypto` module. Data seperti Email dan Nomor Telepon dienkripsi secara otomatis saat masuk ke database (`to`) dan didekripsi saat dibaca (`from`).
- **File:** `src/server/infrastructure/security/EncryptionHelper.ts`
- **Kepatuhan:** Sesuai standar UU PDP untuk perlindungan data pribadi.

### 2. Password Hashing (Argon2id)
Menggunakan algoritma **Argon2id** (pemenang Password Hashing Competition) yang tahan terhadap serangan GPU/ASIC dan Side-channel.
- **File:** `src/server/infrastructure/security/HashHelper.ts`

### 3. Data Masking
Implementasi fungsi `toMasked()` pada entitas User untuk memastikan API tidak pernah membocorkan data asli secara penuh ke klien yang tidak berwenang.
- Contoh: `sa.pamanukan@gmail.com` -> `sa***@gm***.com`

### 4. Middleware Keamanan (Helmet & Rate Limit)
- **Helmet.js:** Menambahkan berbagai HTTP header untuk mencegah XSS, Clickjacking, dan MIME sniffing.
- **Rate Limiter:** Membatasi jumlah permintaan per IP (Brute Force Protection).
- **File:** `server.ts`

---

## 🛠️ Persiapan (Konfigurasi Hostinger/VPS)

### 1. Environment Variables
Buat file `.env` di root direktori (Gunakan `.env.example` sebagai referensi):
```env
DATABASE_URL=postgres://user:password@host:port/database
KMS_MASTER_KEY=64_karakter_hex_untuk_aes_256
ARGON2_SECRET=secret_pepper_keamanan
```

### 2. Instalasi & Build
Untuk menjalankan di Hostinger (Node.js App Lifecycle):
```bash
npm install
npm run build   # Build Frontend
npm start       # Jalankan Backend
```

---

## 🚀 Cara Menambahkan Fitur Baru
1.  **Entity:** Tambahkan file baru di `src/server/core/entities/`.
2.  **Transformer:** Gunakan `PIIEncryptionTransformer` untuk kolom sensitif.
3.  **Repository:** Buat class baru di `src/server/infrastructure/repositories/` untuk logika query.
4.  **Endpoint:** Daftarkan route baru di `server.ts`.

---

## 🏛️ Kepatuhan & Kepercayaan (Trust & Legal)

### 1. Kepatuhan PCI DSS (Midtrans/Xendit)
Untuk integrasi pembayaran seperti Midtrans (Snap) atau Xendit, kode harus memastikan data kartu tidak menyentuh server backend Anda.
- **Frontend:** Gunakan `midtrans-client` atau library resmi yang membuka modal `Snap` secara langsung.
- **Backend:** Hanya terima `notification` dari Midtrans via webhook yang divalidasi dengan `signature_key`.
- **Hasil:** Aplikasi Anda otomatis PCI DSS compliant karena data kartu dimitigasi sepenuhnya ke Payment Gateway.

### 2. Audit Trail (Log Audit)
Setiap tindakan kritis (pendaftaran, pembayaran, login) dicatat ke tabel `audit_logs`.
- **Kolom:** ID User, Aksi, Metadata (JSON), Alamat IP, dan Timestamp.
- **Tujuan:** Memenuhi kewajiban "Penyelenggara Sistem Elektronik" (PSE) untuk menyediakan jejak audit jika terjadi masalah hukum.

### 3. Izin PSE Kominfo
Pastikan nomor pendaftaran PSE ditampilkan di footer aplikasi untuk membangun kepercayaan pengguna lokal.
- Contoh di Footer: `PSE Terdaftar: 000XXX/DJAI.PSE/01/202X`

---

*Dengan implementasi ini, aplikasi Anda siap untuk audit legal dan memberikan rasa aman maksimal bagi pengguna di Indonesia.*
