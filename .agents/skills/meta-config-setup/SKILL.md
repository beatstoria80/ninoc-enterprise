---
name: meta-config-setup
description: "Panduan langkah demi langkah untuk melakukan setup, integrasi, dan perbaikan konfigurasi Meta (Pixel, Conversions API, Catalog Feed, dan Analytics) di proyek e-commerce."
triggers: ["meta ads", "meta pixel", "meta capi", "conversions api", "facebook pixel", "facebook ads", "meta feed", "katalog meta"]
---

# Meta Configuration & Integration Guide

Panduan ini berisi tahapan-tahapan yang benar (berdasarkan pengalaman implementasi sebelumnya) untuk mengatur integrasi Meta (Facebook/Instagram) di ekosistem Next.js App Router. Ikuti panduan ini dengan saksama untuk mencegah *error* umum saat deployment di Vercel.

## 1. Environment Variables (.env)
Pastikan kredensial berikut selalu dikonfigurasi dengan benar di `.env.local` dan panel Vercel (Produksi):
```env
NEXT_PUBLIC_META_PIXEL_ID="1234567890" # ID Meta Pixel (dapat terekspos di browser)
META_CAPI_TOKEN="EAAX..." # Token Conversions API (RAHASIA, jangan taruh di NEXT_PUBLIC)
META_AD_ACCOUNT_ID="act_12345" # Opsional: Untuk Dashboard Analytics (Server-Side)
```

## 2. Pemasangan Meta Pixel (Client-Side)
Meta Pixel harus dipasang menggunakan komponen `next/script` bawaan Next.js untuk menjaga performa skor Web Vitals.
- Lokasi biasanya di `src/app/layout.tsx` atau komponen pembungkus global.
- **Strategi Pemuatan:** Gunakan `strategy="afterInteractive"`.
- Jangan menggunakan pemuatan sinkron yang memblokir DOM.

## 3. Product Catalog Feed (XML)
Ninoc Enterprise menggunakan feed dinamis XML untuk Katalog Meta (biasanya di `src/app/feed/meta.xml/route.ts`).
**Aturan Kritis (Belajar dari Sejarah Error Global Vercel):**
1. **Dynamic Route:** Pastikan file menggunakan `export const dynamic = 'force-dynamic';` agar feed tidak di-cache secara statis dan kedaluwarsa.
2. **URL Parsing (Bahaya Vercel):** JANGAN PERNAH memasukkan variabel lingkungan langsung ke `new URL()` tanpa verifikasi protokol. Jika `NEXT_PUBLIC_APP_URL` di Vercel diatur sebagai `ninoc.store` (tanpa `https://`), Next.js akan CRASH secara fatal (TypeError: Invalid URL) dan menyebabkan Global 500 Error.
   
   **Cara Benar (Contoh):**
   ```typescript
   let rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
   if (!rawUrl.startsWith('http')) rawUrl = `https://${rawUrl}`;
   const siteUrl = rawUrl;
   ```
3. **Format Harga:** Pastikan harga (price) menyertakan kode mata uang standar ISO (contoh: `IDR`) pada feed. 
   Contoh: `<g:price>${product.price} IDR</g:price>`

## 4. Meta Conversions API (Server-Side)
- Konversi (*Purchase*, *Add to Cart*) di sisi server sangat penting di era iOS 14+. 
- Lakukan panggilan ke Graph API (`https://graph.facebook.com/v19.0/{PIXEL_ID}/events`) di dalam Server Actions (misalnya saat proses *Checkout* berhasil atau Midtrans Webhook diterima).
- Jangan memaparkan `META_CAPI_TOKEN` ke komponen sisi klien.

## 5. Dasbor Analytics (Admin UI)
- Jika membangun dasbor laporan Meta Analytics untuk admin, terapkan pola **Service Repository**. 
- Ekstrak *data fetching* berat (GraphQL/REST API ke Facebook) di dalam sebuah **Server Action** (contoh: `src/actions/metaAnalytics.ts`).
- Jangan menggunakan panggilan data masif di *Client Component* via `useEffect()` karena akan menyebabkan *memory leak* dan merusak skalabilitas aplikasi ketika data order/iklan bertambah ribuan.
- Sediakan data *mock* (simulasi) jika `META_AD_ACCOUNT_ID` belum diatur, agar UI tidak *crash* dan UX tetap terjaga.
