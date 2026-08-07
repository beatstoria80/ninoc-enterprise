# Panduan Infrastruktur & Integrasi WhatsApp (NINOC STORE)

Dokumen ini mendeskripsikan implementasi teknis, *flow* arsitektur, serta *state* (status) terkini dari Integrasi WhatsApp API (Meta) di NINOC STORE. Dokumen ini bertujuan memandu *Agent* atau *Engineer* selanjutnya apabila diperlukan *maintenance* atau pengembangan lebih lanjut.

## 1. Arsitektur Teknis & Flow Pengiriman

Sistem notifikasi WhatsApp ini telah di-*refactor* menjadi standar *Production-Grade* yang aman untuk dijalankan di *environment Serverless* (seperti Vercel) untuk menangani konkurensi (beban tinggi).

- **Library Inti**: `src/lib/whatsapp.ts`
  - Berfungsi sebagai sentral layanan WhatsApp Cloud API.
  - Memiliki mekanisme **Robust Exponential Backoff**: Apabila Meta API mengembalikan status `429 (Too Many Requests)` atau `500+ (Server Error)`, sistem akan menjeda dirinya sendiri secara eksponensial (1s, 2s, 4s) dan mencoba ulang (hingga 3 kali maksimal). Hal ini mencegah pesan hilang atau ter-*drop* saat puncak (peak) transaksi.
  - Menggunakan API bawaan `fetch` untuk memanggil Graph API `v18.0`.

- **Trigger Points (Titik Injeksi)**
  - **Saat Checkout (Menunggu Pembayaran)**: Diinjeksikan pada `src/domain/checkout/CheckoutService.ts`. Pesan WhatsApp dikirimkan tepat setelah keranjang diubah menjadi pesanan (Order) di *database*, sebelum halaman dialihkan ke halaman pembayaran Midtrans.
  - **Saat Pembayaran Sukses (Webhook)**: Diinjeksikan pada `src/app/api/payments/webhook/route.ts`. Pesan "Invoice Success" dikirimkan saat Webhook Midtrans mengonfirmasi pembayaran.

- **Vercel-Safe Background Execution**
  Untuk mencegah masalah umum di Next.js Vercel (di mana tugas asinkron dimatikan secara prematur saat respons HTTP selesai), seluruh pemanggilan pengiriman WhatsApp dibungkus dengan `after()` (dari `next/server`).
  - Ini memastikan proses `fetch` berjalan sempurna di belakang layar *(non-blocking)* tanpa memperlambat *loading* pembeli.

## 2. Template Pesan (Message Templates)

Seluruh nama template dikelola di konstan `WA_TEMPLATES` di `src/lib/whatsapp.ts`.

| Key di Kode | Nama Template di Meta | Bahasa | Fungsi & Variabel | Status Saat Ini |
| :--- | :--- | :--- | :--- | :--- |
| `ORDER_PENDING` | `order_pending_id` | `id` | Mengingatkan pembayaran (Nama, ID Order, Estimasi) | **LIVE** (Menunggu Approval Meta) |
| `INVOICE_SUCCESS` | `invoice_success` | `id` | Mengonfirmasi pembayaran sukses | **LIVE** |
| `SHIPPING_UPDATE` | `shipping_update` | `id` | Pemberitahuan pengiriman / resi oleh admin | **LIVE** |
| `ORDER_DELIVERED` | `order_delivered` | `id` | Konfirmasi paket telah diterima | **LIVE** |

*Catatan untuk Agent Berikutnya: Jika Meta menolak (Reject) template `order_pending_id`, ubah kembali kode `ORDER_PENDING` ke nama template alternatif yang tersedia.*

## 3. Hal yang Perlu Ditindaklanjuti (Next Steps)

Dokumen ini ditulis saat integrasi fitur "Notifikasi Checkout" baru saja selesai. Berikut adalah daftar (*checklist*) hal-hal yang perlu dilakukan oleh pemilik sistem atau *Engineer* selanjutnya:

- [ ] **Validasi Status Template Baru**: Memeriksa *dashboard* Meta apakah template `order_pending_id` sudah berstatus hijau (**Aktif/Approved**).
- [ ] **Pengetesan E2E (End-to-End)**: Melakukan simulasi belanja (Checkout) di *website* menggunakan *Test Number* untuk memastikan *flow Checkout -> WhatsApp -> Midtrans* berjalan tanpa *error* di sisi pengguna.
- [ ] **Migrasi ke Production (Nomor Asli)**: Saat ini API terhubung melalui "Test Number" Meta (Nomor Sandbox) yang memiliki keterbatasan penerima (hanya maksimal 5 nomor terdaftar). Langkah berikutnya adalah:
  1. Mendaftarkan Nomor Handphone Bisnis asli (Production) ke Meta WhatsApp Manager.
  2. Mendapatkan `Phone Number ID` yang baru.
  3. Memperbarui Environment Variable `WHATSAPP_PHONE_NUMBER_ID` di file `.env` (lokal) dan di *dashboard* Vercel (Production) dengan ID dari nomor asli tersebut.

---
**Timestamp Penulisan**: 7 Agustus 2026
**Lingkungan (Environment)**: Next.js 16.2.x (App Router), Vercel Serverless.
