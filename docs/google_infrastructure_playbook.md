# NINOC Enterprise: Buku Panduan Infrastruktur Ekosistem Google

Dokumen ini adalah cetak biru (*blueprint*) rahasia perusahaan untuk mengintegrasikan ekosistem analitik dan periklanan Google secara *End-to-End* pada aplikasi web Next.js skala *Enterprise* (seperti NINOC). 

Buku panduan ini dirancang khusus agar Anda dapat mereplikasi (menduplikasi) infrastruktur ini di masa depan saat aplikasi ini dijual secara komersial (*White-label*), tanpa harus menyewa ahli *Cloud* atau membeli kursus berbayar.

---

## Tahap 1: Pemasangan "Sensor Pelacak" (Google Tag Manager)

Google Tag Manager (GTM) bertugas merekam pergerakan pengguna, klik, dan pembelian, lalu mengirimkannya ke Meta Ads (Facebook/IG) dan Google Ads.

### Langkah-langkah:
1. Kunjungi [tagmanager.google.com](https://tagmanager.google.com/) dan buat Akun baru dengan nama platform Anda.
2. Di bagian "Target Platform", pilih **Web**.
3. Setelah akun dibuat, Anda akan mendapatkan ID unik dengan format `GTM-XXXXXXX`.
4. Simpan ID tersebut di file konfigurasi rahasia Anda (`.env.local` di komputer lokal, dan di *Environment Variables* Vercel) dengan nama kunci: `NEXT_PUBLIC_GTM_ID`.
5. **Injeksi Kode ke Next.js:** 
   Karena aplikasi kita menggunakan Next.js (App Router), kita tidak memasang kode panjang (JavaScript), melainkan menggunakan komponen khusus dari Google:
   - Buka file `src/app/layout.tsx`.
   - Tambahkan *import*: `import { GoogleTagManager } from '@next/third-parties/google'`.
   - Letakkan komponen pelacak ini di bawah tag `<body>`:
     ```tsx
     <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || ''} />
     ```

> [!TIP]
> Dengan menggunakan GTM, semua pengaturan piksel Facebook, TikTok, dan Google Analytics di masa depan hanya perlu dilakukan lewat *dashboard* GTM, **tanpa perlu mengubah kode pemrograman web lagi**.

### Filosofi GTM: Mengapa Ini Sangat Penting?
Bayangkan GTM itu seperti **"Terminal Colokan Listrik (Stopkontak Paralel)"**.

**Sebelum Ada GTM:**
Setiap kali tim *Marketing* ingin beriklan di *platform* baru, mereka harus meminta tim IT untuk membongkar kode *website*:
- "Pasang kode Facebook Pixel." *(Bongkar kode)*
- "Pasang kode TikTok Pixel." *(Bongkar kode lagi)*
Ini lambat, merepotkan, dan berisiko membuat *website* *error* (anjlok).

**Setelah Ada GTM:**
Kita hanya perlu memasang **Satu Stopkontak Utama (GTM)** ke dalam kode *website* satu kali saja (pada file `layout.tsx`). Mulai saat itu, jika tim *Marketing* ingin menjalankan *Meta Ads* (Facebook/IG), mereka HANYA PERLU:
1. *Login* ke *dashboard* [tagmanager.google.com](https://tagmanager.google.com).
2. Klik tombol **"Add New Tag"** > Pilih **Facebook Pixel** / **Meta Ads**.
3. Masukkan ID Akun Meta Ads mereka, lalu Simpan.

*Boom!* GTM akan langsung menginjeksi pelacak Meta Ads ke dalam *website* secara otomatis tanpa tim IT menulis sebaris kode pun. Semua data pembelian, *Add to Cart*, dan perilaku audiens akan langsung mengalir deras ke kecerdasan buatan (AI) Facebook Anda!

---

## Tahap 2: Meretas "Jantung" Google Ads (Infrastruktur API)

Ini adalah bagian paling kompleks bernilai tinggi. Tujuannya adalah menyedot data pengeluaran (uang yang dibakar iklan) langsung ke dalam *Dashboard Admin* Anda secara otomatis tanpa buka-buka aplikasi Google.

### A. Mendapatkan Kunci Dasar (Client ID & Secret)
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru (misal: "NINOC Store").
3. Cari menu **APIs & Services > Library**, lalu cari dan aktifkan **Google Ads API**.
4. Masuk ke menu **OAuth consent screen**:
   - Pilih tipe *External*.
   - Isi nama aplikasi (misal: "NINOC Client") dan email dukungan Anda.
   - Biarkan statusnya sebagai **"Testing"** jika aplikasi untuk internal admin, lalu tambahkan email Anda ke kolom **Test Users**.
   - Jika aplikasi dijual bebas, ubah statusnya menjadi **"In Production"** (perlu verifikasi keamanan panjang dari Google).
5. Masuk ke menu **Credentials** > Klik **Create Credentials** > Pilih **OAuth client ID**.
   - Application type: **Web application**.
   - Pada kolom *Authorized redirect URIs*, tambahkan persis tautan ini: `https://developers.google.com/oauthplayground` (Sangat krusial untuk langkah B).
   - Klik **Create**. Anda akan mendapatkan **Client ID** dan **Client Secret**. Simpan ini ke `.env.local` Anda.

### B. Mendapatkan "Tiket Abadi" (Refresh Token)
1. Buka [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Klik ikon gir (Pengaturan) di pojok kanan atas.
3. Centang **Use your own OAuth credentials** dan masukkan `Client ID` dan `Client Secret` dari langkah sebelumnya.
4. Di kolom sebelah kiri, masukkan URL jangkauan khusus (*custom scope*): `https://www.googleapis.com/auth/adwords`.
5. Klik **Authorize APIs**. Anda akan diminta *login* ke akun Google Anda. Abaikan peringatan "Unsafe" dengan mengeklik *Advanced > Continue*.
6. Klik tombol biru **Exchange authorization code for tokens**.
7. *Boom!* Anda akan mendapatkan kode super panjang bernama **Refresh Token**. Simpan kode ini ke `.env.local`.

### C. Mendapatkan Izin Beriklan (Developer Token & Customer ID)
1. Masuk ke *dashboard* [Google Ads](https://ads.google.com).
2. Catat angka 10 digit di pojok kanan atas layar (misal: `123-456-7890`), buang tanda stripnya. Ini adalah **Customer ID** Anda.
3. Klik ikon kunci pas (Tools & Settings) > Pilih **API Center**.
4. Lengkapi formulir pendaftaran API tingkat Dasar (*Basic Access*).
5. Setelah disetujui instan, Anda akan melihat teks acak di layar. Itu adalah **Developer Token**. Simpan ke `.env.local`.

> [!IMPORTANT]
> Total ada 5 variabel rahasia yang **WAJIB** dimasukkan ke dalam server Vercel Anda agar fitur ini menyala:
> 1. `GOOGLE_ADS_CLIENT_ID`
> 2. `GOOGLE_ADS_CLIENT_SECRET`
> 3. `GOOGLE_ADS_REFRESH_TOKEN`
> 4. `GOOGLE_ADS_DEVELOPER_TOKEN`
> 5. `GOOGLE_ADS_CUSTOMER_ID`

---

## Tahap 3: Membangun Jembatan Kode (Back-End)

Setelah Anda memegang 5 kunci ajaib dari Google, saatnya membuat aplikasi Anda bisa "berbicara" dengan Google.

### Langkah-langkah:
1. **Instal Pustaka Khusus:** Jalankan perintah `npm install google-ads-api`. Pustaka ini sangat sakti untuk memotong ribuan baris kode rumit menjadi sangat sederhana.
2. **Buat Server Action (`src/actions/googleAds.ts`):**
   Buat fungsi yang dikonfigurasi untuk menarik data pada tingkat Kampanye (*Campaign Level*). 
   ```typescript
   // Query Sakti (Menarik data pengeluaran, klik, dan konversi bulan ini)
   const query = `
     SELECT 
       campaign.id, campaign.name, 
       metrics.cost_micros, metrics.clicks, 
       metrics.impressions, metrics.conversions 
     FROM campaign 
     WHERE segments.date DURING THIS_MONTH 
       AND metrics.cost_micros > 0
   `;
   ```

> [!TIP]
> Perhatikan `metrics.cost_micros`. Google mengembalikan nilai mata uang dalam bentuk mikro (1 juta = 1 IDR). Pastikan *backend* Anda membaginya dengan angka 1.000.000 (`/ 1000000`) sebelum menampilkannya ke layar agar nilainya tidak membengkak!

---

## Tahap 4: Memvisualisasikan Data (Front-End UI)

Tahap terakhir, tampilkan data yang disedot tadi ke *Dashboard Admin* aplikasi.

### Arsitektur UI (Dua Layar Khusus):
Karena ini aplikasi skala Enterprise (*White-label*), arsitektur tampilan tidak boleh campur aduk. 

1. **Layar Operasional Laba (MarketingTab.tsx):**
   Di layar ini, jumlahkan Total Uang yang Dibakar oleh Google Ads dengan komisi Affiliate dan Diskon Voucher. Jadikan sebagai pengurang Laba Kotor. Hasil akhirnya memunculkan nilai **True Net Profit**. Ini sangat disukai pemilik bisnis yang tidak suka metrik rumit.
   
2. **Layar "Mirror" Analitik Khusus (GoogleAdsTab.tsx):**
   Buat menu terpisah di *sidebar* yang khusus membedah iklan. Tampilkan tabel komprehensif berisi *Campaign Name*, *Spend*, *Clicks*, *Impressions*, perhitungan *CTR (Click-Through Rate)*, dan Konversi. 

---

## Tahap 5: Integrasi Web Analytics (GA4 & Google Search Console)

Selain Google Ads, *dashboard* operasional juga perlu menyedot data analitik pengunjung organik dan performa SEO secara *real-time*. Berbeda dengan Google Ads yang menggunakan sistem OAuth (Client ID & Secret), GA4 dan GSC menggunakan sistem keamanan **Google Service Account** (Sistem Robot).

### A. Membuat "Email Robot" (Service Account)
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Pastikan Anda berada di proyek yang sama. Cari dan aktifkan dua API ini:
   - **Google Analytics Data API**
   - **Google Search Console API**
3. Masuk ke menu **IAM & Admin > Service Accounts**.
4. Buat *Service Account* baru (misal: `ninoc-robot`). Abaikan bagian *roles*, lalu simpan.
5. Anda akan mendapatkan email robot yang berakhiran `@...gserviceaccount.com`. Ini adalah variabel `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

### B. Mengambil Kunci Rahasia
1. Pada halaman *Service Accounts*, klik tiga titik di sebelah email robot tersebut, lalu pilih **Manage keys**.
2. Klik **Add Key > Create new key > JSON**.
3. File JSON akan terunduh. Buka dengan Notepad, lalu salin seluruh teks panjang di dalam `"private_key"` (termasuk `-----BEGIN PRIVATE KEY-----` dan `\n`). Ini adalah variabel `GOOGLE_PRIVATE_KEY`.

### C. Mengundang Robot ke Rumah Data
Robot tidak akan bisa membaca data jika tidak diundang sebagai tamu di dasbor utama Anda.
1. **Google Analytics:** Masuk ke *Admin > Property Access Management*, lalu tambahkan email robot tadi sebagai **Viewer**. Di bagian *Property Details*, catat **Property ID** Anda (angka murni 9-10 digit, bukan yang berawalan "G-"). Ini adalah variabel `GA4_PROPERTY_ID`.
2. **Search Console:** Masuk ke *Settings > Users and permissions*, tambahkan email robot dengan izin **Restricted** atau **Full**. Catat URL *property* Anda (contoh: `https://ninoc.store/`). Ini adalah variabel `GSC_SITE_URL`.

> [!IMPORTANT]
> Masukkan 4 variabel Web Analytics ini ke dalam Vercel klien Anda (diikuti dengan *Redeploy*) agar *Tab* Web Analytics menyala:
> 1. `GOOGLE_SERVICE_ACCOUNT_EMAIL`
> 2. `GOOGLE_PRIVATE_KEY` (Bisa di-paste utuh beserta tanda kutipnya `"..."`)
> 3. `GA4_PROPERTY_ID`
> 4. `GSC_SITE_URL`

---

### Penutup
Infrastruktur 5 tahap di atas adalah rahasia dapur perusahaan rintisan teknologi (SaaS). Jika Anda membangun aplikasi e-commerce baru di masa depan untuk klien lain (Konsep *White-Label*), cukup ulangi langkah persiapan di atas untuk mengambil kunci klien Anda, tempelkan ke Vercel klien tersebut, dan aplikasi secara ajaib akan langsung berfungsi seperti NINOC tanpa perlu mengubah kode pemrograman apa pun!
