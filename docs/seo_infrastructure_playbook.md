# NINOC Enterprise: Buku Panduan Infrastruktur SEO Terpusat

Dokumen ini adalah cetak biru (*blueprint*) kedua dari infrastruktur NINOC Enterprise. Melanjutkan *blueprint* Google Ads, panduan ini membongkar rahasia di balik arsitektur **Search Engine Optimization (SEO) level *Enterprise*** yang tertanam di dalam aplikasi Next.js ini.

Arsitektur ini dirancang secara *Dynamic* dan *Server-Side Rendered (SSR)* agar produk dan artikel kita otomatis terindeks oleh mesin pencari Google dalam hitungan jam.

---

## Tahap 1: Metadata Global & Open Graph (Jantung SEO)

Sebagian besar *website* menggunakan *plugin* tambahan untuk SEO, namun di Next.js (App Router), kita memanipulasi *header* langsung dari *server* melalui file utama: `src/app/layout.tsx`.

### Konfigurasi Kunci:
1. **Dynamic Locale & Canonical URL:**
   Sistem secara cerdas mendeteksi bahasa pengunjung (*English* / *Indonesian*) dan menyajikan `title` dan `description` yang sesuai. Sistem juga otomatis men- *generate* tautan *Canonical* (`<link rel="canonical">`) agar Google tidak menghukum kita karena masalah duplikasi halaman (URL).
2. **Open Graph & Twitter Cards:**
   Ini adalah rahasia mengapa tautan *website* kita terlihat "Sangat Cantik" (muncul gambar besar dan judul tebal) ketika dibagikan di WhatsApp, iMessage, Facebook, atau X (Twitter).
3. **Google Site Verification:**
   Anda tidak perlu mengunggah file HTML aneh-aneh dari Google Search Console. Kode verifikasi sudah tertanam di dalam objek `verification.google` di metadata.

---

## Tahap 2: Metadata Dinamis per Produk

Bagaimana caranya agar saat sebuah tautan produk (misalnya Baju "Heavyweight Hoodie") dibagikan ke WhatsApp, gambar *Hoodie* tersebut yang muncul, bukan gambar logo toko?

Jawabannya ada di file: `src/app/shop/[slug]/page.tsx`.

### Arsitektur Dinamis (`generateMetadata`):
1. Sebelum halaman di- *render* ke layar pembeli, *server* akan menjalankan `generateMetadata`.
2. Sistem akan melakukan *query* langsung ke **Supabase** berdasarkan URL (*slug*).
3. *Server* mengambil `name`, `description`, dan `image_url` produk tersebut, lalu menyuntikkannya ke dalam *tag* `<meta>` (Open Graph & Twitter Card) secara *real-time*.

> [!TIP]
> Inilah kekuatan utama arsitektur Next.js. Bahkan jika Anda memiliki 1.000 produk baru, sistem SEO ini otomatis bekerja 1.000 kali tanpa Anda harus menulis deskripsi SEO secara manual!

---

## Tahap 3: Bahasa Robot: Structured Data (JSON-LD)

Ini adalah senjata rahasia yang jarang dimiliki toko *online* biasa. **JSON-LD** adalah "bahasa dewa" yang dibaca langsung oleh *bot* Google agar *website* Anda muncul dalam bentuk "Kotak Kaya" (*Rich Snippets*) di hasil pencarian.

Di file `src/app/layout.tsx` dan halaman Produk, kita menginjeksi beberapa JSON-LD:
1. **`Organization` & `Brand`**: Memberitahu Google bahwa NINOC adalah entitas bisnis resmi yang bermarkas di Bandung, lengkap dengan nomor telepon *Customer Service*.
2. **`LocalBusiness` (ClothingStore)**: Membantu SEO Lokal (Google Maps/Google My Business). Jika orang di Bandung mencari "Toko Baju Terdekat", algoritma ini akan aktif.
3. **`WebSite` (SearchAction)**: Ini memicu munculnya "Kolom Pencarian Khusus" (*Search Box*) di bawah hasil pencarian Google NINOC.
4. **`FAQPage`**: Menyuntikkan format Pertanyaan & Jawaban agar langsung muncul di halaman pertama Google tanpa orang perlu membuka *website*.
5. **`Product` & `AggregateRating`**: (Di halaman produk) Memberitahu Google tentang harga produk (`IDR`) dan jumlah bintang (*Review*), sehingga bintang kuning akan muncul di hasil pencarian Google.

---

## Tahap 4: Otomatisasi Peta Situs (Dynamic Sitemap & Robots)

Mesin pencari butuh peta untuk merayapi *website*. 

1. **Robots.txt (`src/app/robots.ts`)**:
   Ini adalah polisi lalu lintas. Kita memberitahu Googlebot: "Boleh merayapi semuanya, silakan indeks semua gambar dalam ukuran besar (*max-image-preview: large*)."
2. **Dynamic Sitemap (`src/app/sitemap.ts`)**:
   - Jika *website* biasa menggunakan `sitemap.xml` statis (yang harus di- *update* manual setiap kali ada produk baru), kita menggunakan `sitemap.ts`.
   - Kode ini diset untuk **Revalidate = 3600** (Setiap 1 Jam).
   - Artinya, setiap 1 jam, *server* akan bertanya ke pangkalan data Supabase: *"Adakah produk baru?"* atau *"Adakah artikel Logbook baru?"* 
   - Jika ada, ia langsung membuatkan URL baru di dalam peta situs, lalu menyerahkan peta segar tersebut kepada Google.

---

### Penutup
Infrastruktur SEO yang terpasang di NINOC Enterprise ini setara dengan arsitektur e-commerce kelas dunia. Jika Anda memberikan *Source Code* ini kepada klien (karena Anda menjadikannya layanan *White-label*), pastikan mereka hanya mengubah file `robots.ts`, konstanta `BASE_URL`, dan variabel media sosial di `layout.tsx`. Sisanya (SEO Produk, Peta Situs, Skema Data) akan berjalan murni secara otomatis layaknya mesin pencetak uang!
