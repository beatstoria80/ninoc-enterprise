"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO REPLY CONFIGURATION — Semua respons auto-reply di sini
// ═══════════════════════════════════════════════════════════════════════════════

interface ReplyCategory {
  label: string;
  icon: string;
  color: string;
  iconColor: string;
  subject: string;
  placeholder: string;
  keywords: string[];
  responses: {
    priority: number;
    trigger: string;
    content: string;
  }[];
  defaultResponse: string;
}

const AUTO_REPLY_CONFIG: Record<string, ReplyCategory> = {
  // ───────────────────────────────────────────────────────────────
  // SHIPPING / TRACKING — Lacak Pesanan
  // ───────────────────────────────────────────────────────────────
  shipping: {
    label: 'Lacak Pesanan',
    icon: 'Truck',
    color: 'bg-blue-50 border-blue-100 text-blue-600',
    iconColor: 'text-blue-500',
    subject: 'Tracking Pesanan',
    placeholder: 'Ketik nomor Order ID atau resi pengiriman...',
    keywords: [
      'lacak', 'tracking', 'track', 'resi', 'awb', 'tracking number',
      'kirim', 'dikirim', 'pengiriman', 'pesanan', 'order',
      'delivered', 'delivery', 'sampai', 'sampe', 'belum sampai', 'blm sampe',
      'estimasi', 'eta', 'kurir', 'ekspedisi', 'jne', 'j&t', 'jnt',
      'sicepat', 'anteraja', 'anteraja', 'siCepat', 'pos', 'wahana',
      'dalam perjalanan', 'sedang dikirim', 'proses kirim',
      'status kirim', 'posisi barang', 'lokasi paket', 'barang saya',
      'paket', 'package', 'package delivery',
    ],
    responses: [
      {
        priority: 1,
        trigger: 'sudah sampai|sudah diterima|udah sampai|udh sampai|sampe|sampe|diterima',
        content: `Halo! Terima kasih sudah menghubungi NINOC. 😊

Kami memahami Anda menanyakan status pengiriman. Berikut langkah lacak pesanan:

📦 **Cara Lacak:**
1️⃣ Buka email / SMS yang kami kirim saat barang dikemas
2️⃣ Salin **nomor resi (AWB)** — contoh: JD014200000019830400
3️⃣ Buka website ekspedisi terkait (JNE / J&T / SiCepat / AnterAja)
4️⃣ Paste nomor resi di kolom tracking

🔗 **Link Tracking Langsung:**
• JNE: https://track.jne.co.id
• J&T: https://jet.co.id/track
• SiCepat: https://www.sicepat.com/check-awb
• AnterAja: https://anteraja.id/tracking

📱 **Atau lacak via chat ini:**
Ketik **NCO-XXXXXXXX** (Order ID dari email konfirmasi) dan kami bantu lacak langsung.

Jika ada kendala (paket stuck, terlambat, rusak), silakan ceritakan nomor pesanan dan resinya — tim kami akan bantu follow-up ke pihak kurir 🙏`,
      },
      {
        priority: 2,
        trigger: 'belum|sedang|proses|pending|menunggu|still|still',
        content: `Kami mengerti pesanan Anda sedang dalam proses. 🕐

📋 **Status Pengiriman:**
Setelah pembayaran berhasil, pesanan diproses 1-2 hari kerja. Setelah itu:
1️⃣ Barang dikemas dan diberikan ke kurir
2️⃣ Kami kirim email/SMS berisi **nomor resi (AWB)**
3️⃣ Bisa dilacak di website ekspedisi

⏱️ **Estimasi Pengiriman:**
• Same Day: 2-6 jam (kota yang dituju)
• Instant: 1-3 jam
• Reguler: 2-5 hari kerja (tergantung jarak)

📦 **Cara Cek Status:**
Ketik **Order ID** (format: NCO-XXXXXXXX) di chat ini — kami bantu lacak langsung.

Jika sudah melebihi estimasi, tolong kirimkan nomor pesanan dan tim kami akan segera follow-up 🙏`,
      },
      {
        priority: 3,
        trigger: 'stuck|macet|terlambat|lambat|delay|overdue|batal|delay',
        content: `Kami memahami kekhawatiran Anda atas keterlambatan pengiriman. Kami ikut prihatin dan akan bantu semaksimal mungkin. 🙏

📋 **Langkah yang Bisa Kami Lakukan:**
1️⃣ Mohon kirimkan **nomor Order ID** atau **nomor resi (AWB)** melalui chat ini
2️⃣ Tim kami akan langsung **follow-up ke pihak ekspedisi** untuk mengcek posisi paket
3️⃣ Jika paket hilang atau rusak, kami akan proses claim ke pihak kurir

⚠️ **Kemungkinan Keterlambatan:**
• Cuaca buruk / bencana alam
• Gudang ekspedisi overload (misal saat tanggal kembar 11.11)
• Alamat tujuan kurang lengkap / tidak jelas
• Tinggi perayaan / hari libur

Mohon kirimkan nomor pesanan dan resinya ya — kami akan tangani secepat mungkin 🙏

Tim NINOC Enterprise`,
      },
    ],
    defaultResponse: `Halo! Terima kasih menghubungi NINOC. 😊

Untuk melacak pesanan, silakan:
1️⃣ Buka email / SMS konfirmasi pengiriman dari NINOC
2️⃣ Salin **nomor resi (AWB)** yang tertera
3️⃣ Lacak di website ekspedisi terkait (JNE / J&T / SiCepat / AnterAja)

📱 **Atau ketik Order ID** (format: NCO-XXXXXXXX) di sini — tim kami bantu lacak langsung.

Jika ada masalah (paket tidak sampai, rusak, stuck), tolong berikan nomor resi dan tim kami akan follow-up 🙏`,
  },

  // ───────────────────────────────────────────────────────────────
  // RETURN / REFUND — Ajukan Retur
  // ───────────────────────────────────────────────────────────────
  return: {
    label: 'Ajukan Retur',
    icon: 'RefreshCw',
    color: 'bg-rose/10 border-rose/10 text-rose',
    iconColor: 'text-rose',
    subject: 'Pengajuan Retur / Refund',
    placeholder: 'Ketik nomor pesanan dan alasan retur...',
    keywords: [
      'retur', 'return', 'balikin', 'balikan', 'balikin barang',
      'refund', 'refun', 'refundkan',
      'tukar', 'tuker', 'tukar barang', 'tukeran', 'exchange', 'swap',
      'ganti', 'ganti barang', 'ganti size', 'ganti ukuran', 'ganti warna',
      'salah size', 'salah ukuran', 'salah barang', 'barang salah',
      'uang kembali', 'dana kembali', 'uang balik', 'refund dana',
      'garansi', 'claim garansi', 'warranty',
      'cacat', 'defect', 'barang rusak', 'barang cacat',
      'rusak', 'komplain', 'keluhan barang', 'barang bermasalah',
      'tidak sesuai', 'beda dari foto', 'beda sama foto', 'beda sama deskripsi',
      'produk tidak sesuai', 'size tidak cocok', 'warna tidak sesuai',
    ],
    responses: [
      {
        priority: 1,
        trigger: 'salah|keliru|salah kirim|salah barang|salah size|salah warna|salah ukuran|salah model',
        content: `Kami sangat menyesal terjadi kesalahan pengiriman. Kami minta maaf atas ketidaknyamanannya. 🙏

📋 **Langkah Pengajuan Retur (Salah Kirim):**

1️⃣ **Siapkan Bukti:**
   • Foto produk yang diterima
   • Foto label pengiriman
   • Foto packaging

2️⃣ **Kirim ke Chat Ini:**
   Format: "PENGAJUAN RETUR — Order ID: [nomor] — Alasan: [salah kirim barang]"

3️⃣ **Tim Kami Akan:**
   • Verifikasi dalam 1x24 jam kerja
   • Kirimkan label pengembalian (jika diperlukan)
   • Proses refund / kirim barang pengganti sesuai kebijakan

⚠️ **Syarat Retur:**
• Barang belum digunakan / dicuci / dirangkai
• Label & tag masih menempel
• Dikemas kembali dengan benar
• Disertakan bukti unboxing (foto/video saat buka paket)

Mohon kirimkan **Order ID** dan **foto barang** yang diterima ya 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 2,
        trigger: 'rusak|cacat|defect|pecah|sobek|不合格',
        content: `Kami turut prihatin mendengar barang yang Anda terima dalam kondisi rusak/cacat. Mohon maaf atas ketidaknyamanannya. 🙏

📋 **Langkah Pengajuan Retur (Barang Rusak / Cacat):**

1️⃣ **Siapkan Bukti (WAJIB):**
   • Foto barang dari beberapa sudut (tunjukkan kerusakan)
   • Foto label pengiriman
   • Video unboxing 1-shot (rekam saat buka paket, tanpa edit/henti)

2️⃣ **Kirim ke Chat Ini:**
   Format: "PENGAJUAN RETUR — Order ID: [nomor] — Alasan: [barang rusak/cacat]"

3️⃣ **Tim Kami Akan:**
   • Verifikasi dalam 1x24 jam kerja
   • Foto kerusakan akan kami teruskan ke tim quality
   • Proses refund atau kirim barang pengganti

⚠️ **Catatan Penting:**
• Kerusakan karena kesalahan produksi (bukan karena pengiriman) = eligible retur
• Kerusakan karena kesalahan sendiri (jatuh, robek, dll) = tidak eligible
• Bukti video unboxing sangat membantu proses klaim

Mohon kirimkan **Order ID** dan **foto/video kerusakan** ya 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 3,
        trigger: 'refund|uang kembali|dana kembali|uang balik|refund dana|pengembalian dana',
        content: `Kami memahami Anda ingin mengajukan refund. Berikut informasi lengkapnya: 🙏

💰 **Jenis Refund di NINOC:**

**1. Refund Otomatis (Pembayaran Gagal / Timeout)**
• Dana kembali otomatis dalam 1-3 hari kerja
•depends on bank masing-masing
• Tidak perlu ajukan manual

**2. Refund Karena Retur / Pembatalan**
• Setelah barang diterima dan diverifikasi
• Proses 3-7 hari kerja
• Dana kembali ke metode pembayaran awal

**3. Kelebihan Bayar**
• Jika ada selisih pembayaran
• Proses 3-5 hari kerja

📋 **Cara Ajukan Refund Manual:**
Kirimkan ke chat ini:
• Order ID
• Bukti transfer / screenshot payment
• Alasan refund

Tim kami akan proses secepat mungkin 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 4,
        trigger: 'tukar|tukar barang|tukar size|tukar ukuran|tukar warna|tukar model|exchange',
        content: `Kami siap membantu proses penukaran barang. Berikut langkah-langkahnya: 🙏

📋 **Langkah Penukaran Barang:**

1️⃣ **Pastikan Termasuk Kategori yang Bisa Ditukar:**
   • Salah ukuran (size S jadi M, dst)
   • Salah warna (minta biru ternyata putih)
   • Salah model (beda dari yang dipesan)
   • CACAT / RUSAK dari pihak produksi

2️⃣ **Tidak Eligible Tukar:**
   • Sudah dipakai / dicuci / dirubah
   • Kerusakan karena kesalahan sendiri
   • Lebih dari 7 hari setelah diterima

3️⃣ **Proses Tukar:**
   • Kirimkan **Order ID** + **foto barang** + **alasan tukar** ke chat ini
   • Tim kami akan memberikan instruksi pengiriman
   • Setelah barang diterima, kami kirim barang pengganti

📦 **Biaya Tukar:**
• Salah pihak NINOC (salah kirim, cacat produksi) = FREE
• Salah pihak customer (salah size, beda warna pilihan) = biaya kirim ditanggung customer

Mohon kirimkan **Order ID** dan **foto** ya 🙏

Tim NINOC Enterprise`,
      },
    ],
    defaultResponse: `Halo! Terima kasih sudah menghubungi NINOC tentang pengajuan retur/refund. Kami siap membantu. 🙏

📋 **Kategori Retur yang Bisa Diajukan:**

✅ **Eligible Retur:**
• Barang rusak / cacat produksi
• Salah kirim (size, warna, model tidak sesuai)
• Tidak sesuai deskripsi produk
• Barang hilang dalam perjalanan

❌ **Tidak Eligible Retur:**
• Sudah dipakai / dicuci / dimodifikasi
• Kerusakan karena kesalahan customer
• Lebih dari 7 hari setelah diterima

📋 **Langkah Pengajuan:**
1️⃣ Siapkan **Order ID** dan **foto/video bukti**
2️⃣ Kirim ke chat ini dengan format:
   "PENGAJUAN RETUR — Order ID: [nomor] — Alasan: [ceritakan]"

3️⃣ Tim kami akan proses dalam **1x24 jam kerja**

⚠️ **Syarat Wajib:**
• Bukti unboxing video 1-shot (tanpa edit, durasi min 30 detik)
• Label & tag masih menempel
• Barang dikemas kembali dengan benar

Kirimkan nomor pesanan dan detail permasalahannya ya 🙏

Tim NINOC Enterprise`,
  },

  // ───────────────────────────────────────────────────────────────
  // PRODUCT — Tanya Produk, Stok, Ukuran
  // ───────────────────────────────────────────────────────────────
  product: {
    label: 'Tanya Produk',
    icon: 'Package',
    color: 'bg-purple-50 border-purple-100 text-purple-600',
    iconColor: 'text-purple-500',
    subject: 'Tanya Stok & Produk',
    placeholder: 'Ketik nama produk atau pertanyaan Anda...',
    keywords: [
      'stock', 'tersedia', 'available', 'ada', 'ready', 'ready stock',
      'out of stock', 'sold out', 'preorder',
      'size chart', 'chart', 'size guide', 'ukur',
      'warna', 'color', 'colour', 'motif', 'model',
      'bahan', 'material', 'kualitas', 'quality',
      'katalog', 'catalog', 'product', 'item', 'barang', 'produk',
      'berat', 'weight', 'dimensi', 'measurement', 'panjang', 'lebar', 'tinggi',
      'harga', 'price', 'cost', 'berapa', 'range harga',
      'diskon', 'sale', 'promo', 'promosi', 'diskon',
      'ini apa', 'apa itu', 'product ini', 'barang ini',
    ],
    responses: [
      {
        priority: 1,
        trigger: 'stock|tersedia|ada|ready|available|ready stock|stok',
        content: `Terima kasih sudah bertanya! 😊

Kami dengan senang hati membantu informasi produk. Untuk memberikan info yang akurat, tolong berikan:

📦 **Info yang Membantu:**
• Nama produk atau model yang Anda cari
• Ukuran yang Anda butuhkan
• Warna yang Anda inginkan
• Kuantitas yang diperlukan

💡 **Tips:**
• Kunjungi halaman **Shop** di website kami untuk lihat katalog lengkap
• Filter berdasarkan kategori, warna, dan ukuran
• Setiap produk menampilkan **stok real-time**

📱 **Cara Cek Stok Cepat:**
Ketik nama produk di sini, contoh: "T-Shirt NINOC size M warna hitam" — tim kami akan cek stoknya.

 Atau langsung hubungi via WhatsApp: [nomor WA] untuk respons lebih cepat 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 2,
        trigger: 'size|ukuran|chart|guide|ukur',
        content: `Terima kasih bertanya tentang sizing! Berikut panduan lengkapnya: 📏

📐 **Panduan Ukuran NINOC:**

Kami menyediakan **Size Guide** di setiap halaman produk. Berikut cara mengaksesnya:

1️⃣ Buka halaman produk yang Anda minati
2️⃣ Scroll ke bawah, cari bagian **"Size Guide"** atau **"Ukuran"**
3️⃣ Terdapat tabel ukuran (S, M, L, XL, XXL) dengan:
   • Lingkar dada (cm)
   • Panjang badan (cm)
   • Lingkar bahu (cm)
   • Toleransi ±1-2cm

📏 **Tips Mengukur Body:**
• Gunakan pita ukur / meteran
• Ukur bagian yang paling lebar (biasanya dada / dada)
• Jangan terlalu ketat atau longgar

💡 **Jika Still Ragu:**
Kirimkan ke chat ini:
• Tinggi badan Anda
• Berat badan Anda
• Bagian yang biasanya tight / longgar di baju

Tim kami akan bantu rekomendasikan size yang pas 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 3,
        trigger: 'harga|price|cost|berapa|range|mahal|cheap',
        content: `Terima kasih sudah bertanya! Berikut info harga produk NINOC: 💰

📋 **Info Harga:**

💡 **Untuk info harga produk tertentu:**
Ketik nama produk yang Anda maksud — tim kami akan memberikan info harga terbaru.

🎁 **Benefit Belanja di NINOC:**
• ✅ Produk original dengan kualitas terjamin
• ✅ Gratis ongkir (syarat & ketentuan berlaku)
• ✅ Garansi 7 hari untuk produk cacat produksi
• ✅ Promo diskon rutin setiap minggu
• ✅ Reward point untuk setiap pembelian

📱 **Cek Promo Terbaru:**
Kunjungi halaman **Shop** atau ketik "promo" di chat ini untuk info diskon yang sedang berlaku.

Ada produk tertentu yang ingin Anda ketahui harganya? Silakan ketik nama produknya 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 4,
        trigger: 'warna|color|colour|motif|model|varian',
        content: `Terima kasih sudah bertanya! Berikut info warna dan variasi produk NINOC: 🎨

🎨 **Pilihan Warna:**
Setiap produk memiliki pilihan warna yang berbeda-beda. Untuk melihat warna yang tersedia:

1️⃣ Buka halaman produk di website
2️⃣ Cari **pilihan warna** (biasanya di bawah gambar produk)
3️⃣ Klik untuk melihat foto setiap warna

📦 **Info Varian:**
• Warna yang Ready = bisa langsung dipesan
• Warna yang Preorder = perlu menunggu 3-7 hari
• Warna Sold Out = sementara tidak tersedia

💡 **Tanya Warna Spesifik:**
Ketik nama produk + warna yang Anda cari — contoh: "Kemeja NINOC warna sage" — tim kami akan cek ketersediaannya.

🎁 **Tips:**
• Foto warna di website bisa sedikit berbeda dengan warna asli (effek cahaya / layar)
• Jika ragu, jangan ragu untuk bertanya sebelum checkout 🙏

Tim NINOC Enterprise`,
      },
    ],
    defaultResponse: `Terima kasih sudah bertanya tentang produk NINOC! 😊

Untuk memberikan informasi yang tepat, tolong beritahu kami:

📦 **Yang Bisa Kami Bantu:**
• ✅ Cek stok produk tertentu
• ✅ Info ukuran & size guide
• ✅ Info warna & variasi yang tersedia
• ✅ Harga & promo terbaru
• ✅ Rekomendasi produk yang cocok
• ✅ Info bahan & kualitas produk

📱 **Cara Cepat:**
Ketik nama produk yang Anda cari — tim kami akan cek langsung dan memberikan info akurat.

🌐 **Atau kunjungi langsung:**
Kunjungi halaman **Shop** di website kami untuk lihat katalog lengkap dengan filter warna, ukuran, dan kategori.

Kami siap membantu! 🙏

Tim NINOC Enterprise`,
  },

  // ───────────────────────────────────────────────────────────────
  // PAYMENT — Masalah Pembayaran
  // ───────────────────────────────────────────────────────────────
  payment: {
    label: 'Masalah Bayar',
    icon: 'CreditCard',
    color: 'bg-amber-50 border-amber-100 text-amber-600',
    iconColor: 'text-amber-500',
    subject: 'Masalah Pembayaran',
    placeholder: 'Ketik nomor pesanan dan masalah pembayarannya...',
    keywords: [
      'bayar', 'bayarin', 'pembayaran', 'bayar transfer', 'lunas',
      'gagal', 'failed', 'error payment', 'transaction error',
      'bukti transfer', 'transfer berhasil', 'sudah transfer', 'belum transfer',
      'virtual account', 'va', 'vA', 'bank transfer',
      'e-wallet', 'ewallet', 'ovo', 'gopay', 'dana', 'shopee pay', 'spay',
      'cicilan', 'installment',
      'midtrans', 'duitku', 'bill', 'tagihan',
      'konfirmasi', 'konfirmasi pembayaran', 'confirm payment',
      'bukti', 'struk', 'receipt',
      'metode bayar', 'payment method', 'cara bayar',
      'overpaid', 'kelebihan', 'lebih bayar', 'lebih transfer',
    ],
    responses: [
      {
        priority: 1,
        trigger: 'gagal|failed|error|timeout|pending|struk|struck|struck',
        content: `Kami memahami ada masalah dengan pembayaran Anda. Mari kami bantu selesaikan. 🙏

❌ **Pembayaran Gagal / Error:**

📋 **Kemungkinan Penyebab:**
1️⃣ **Saldo tidak cukup** — pastikan saldo cukup sebelum bayar
2️⃣ **VA expired** — Virtual Account kedaluwarsa (24 jam setelah生成)
3️⃣ **Transfer ke rekening salah** — pastikan nomor VA sesuai persis
4️⃣ **Koneksi timeout** — coba ulangi dengan koneksi internet stabil
5️⃣ **Bank maintenance** — coba lagi di lain waktu

📱 **Langkah yang Bisa Dilakukan:**
1️⃣ Buka halaman **Pesanan Saya** di website
2️⃣ Cek status pesanan — jika masih pending, coba bayarkan lagi
3️⃣ Jika sudah expired, buat pesanan baru dengan payment method lain

💳 **Metode Pembayaran yang Tersedia:**
• Virtual Account (BCA, Mandiri, BNI, BRI)
• E-Wallet (OVO, GoPay, Dana, ShopeePay)
• QRIS
• Kartu kredit / debit
• Transfer bank langsung

Mohon kirimkan **Order ID** atau **nomor VA** yang bermasalah — tim kami akan cek dan bantu selesaikan 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 2,
        trigger: 'konfirmasi|confirm|bukti transfer|struk|payment proof|receipt|sudah transfer|sdh transfer|udah transfer|udh transfer',
        content: `Terima kasih telah melakukan pembayaran! Berikut panduan konfirmasi: 🙏

✅ **Langkah Konfirmasi Pembayaran:**

**Otomatis (Paling Cepat):**
Setelah Anda transfer, sistem Midtrans akan otomatis mendeteksi dalam 1-5 menit. **Tidak perlu konfirmasi manual** — cukup tunggu email konfirmasi pembayaran dari kami.

**Manual (Jika belum masuk setelah 30 menit):**
1️⃣ Buka halaman **Pesanan Saya** di website
2️⃣ Klik pesanan yang ingin dikonfirmasi
3️⃣ Upload **bukti transfer** (foto/ screenshot struk)
4️⃣ Tim kami akan verifikasi dalam 1x24 jam kerja

📋 **Info yang Perlu Disertakan:**
• Order ID: NCO-XXXXXXXX
• Tanggal & jam transfer
• Jumlah transfer
• Bank yang digunakan
• Foto bukti transfer

⚠️ **Penting:**
• Pastikan nominal transfer **persis sama** dengan total pesanan
• Jika ada selisih (lebih/kurang), tolong informasikan segera

Kirimkan bukti transfer dan Order ID ke chat ini ya 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 3,
        trigger: 'cod|cash on delivery|tunai|bayarCOD|bayar cash',
        content: `Terima kasih sudah bertanya! 😊

Saat ini NINOC Enterprise belum menyediakan opsi pembayaran COD (Cash on Delivery). Berikut metode pembayaran yang tersedia:

💳 **Metode Pembayaran:**
• Virtual Account (BCA, Mandiri, BNI, BRI, BTPN)
• E-Wallet (OVO, GoPay, Dana, ShopeePay)
• QRIS
• Kartu kredit / debit
• Transfer bank langsung

📱 **Cara Bayar:**
1️⃣ Pilih produk dan masukkan ke keranjang
2️⃣ Checkout dan pilih metode pembayaran
3️⃣ Selesaikan pembayaran via bank / e-wallet yang dipilih
4️⃣ Pesanan akan diproses setelah pembayaran terkonfirmasi

💡 **Tips:**
• Pembayaran via VA biasanya terverifikasi dalam 1-5 menit
• Simpan bukti transfer jika perlu konfirmasi manual

Mohon maaf atas ketidaknyamanannya. Apakah ada yang bisa kami bantu dengan metode pembayaran di atas? 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 4,
        trigger: 'overpaid|kelebihan|lebih bayar|lebih transfer|lebih nominal|refund lebih|refund overpay',
        content: `Terima kasih telah melaporkan kelebihan pembayaran. Kami sangat menghargai kejujuran Anda. 🙏

💰 **Proses Refund Kelebihan Bayar:**

📋 **Langkah yang Akan Kami Lakukan:**
1️⃣ Tim finance akan memverifikasi nominal kelebihan
2️⃣ Dana akan dikembalikan ke **metode pembayaran awal** Anda
3️⃣ Proses refund dalam **3-5 hari kerja**

📋 **Info yang Perlu Disertakan:**
• Order ID: NCO-XXXXXXXX
• Nominal yang dibayarkan
• Nominal yang seharusnya
• Bukti transfer / screenshot

⚠️ **Penting:**
• Refund akan dikirim ke rekening/ e-wallet yang digunakan saat pembayaran
• Jika menggunakan transfer bank, refund ke rekening dengan nama yang sama
• Proses refund tidak dipungut biaya apapun

Mohon kirimkan **Order ID** dan **bukti transfer** ke chat ini ya 🙏 — tim kami akan proses secepat mungkin.

Tim NINOC Enterprise`,
      },
    ],
    defaultResponse: `Halo! Terima kasih telah menghubungi NINOC tentang masalah pembayaran. Kami siap membantu. 🙏

💳 **Metode Pembayaran yang Tersedia:**

**Online:**
• Virtual Account (BCA, Mandiri, BNI, BRI, BTPN)
• E-Wallet (OVO, GoPay, Dana, ShopeePay)
• QRIS
• Kartu kredit / debit
• Transfer bank langsung

📋 **Masalah Umum & Solusi:**

❌ **Pembayaran Gagal:**
→ Buka halaman Pesanan Saya, coba bayarkan lagi dengan metode berbeda

❌ **Sudah Transfer Tapi Status Belum Update:**
→ Tunggu 5-30 menit, sistem auto-sync dari Midtrans

❌ **VA Expired:**
→ Buat pesanan baru dan bayarkan sebelum expired

❌ **Kelebihan Bayar:**
→ Kirimkan bukti transfer + Order ID — kami proses refund 3-5 hari kerja

📱 **Bantuan Cepat:**
Kirimkan **Order ID** dan **deskripsi masalah** ke chat ini — tim kami akan bantu selesaikan secepat mungkin.

Terima kasih 🙏

Tim NINOC Enterprise`,
  },

  // ───────────────────────────────────────────────────────────────
  // COMPLAINT — Keluhan Umum
  // ───────────────────────────────────────────────────────────────
  complaint: {
    label: 'Keluhan',
    icon: 'AlertCircle',
    color: 'bg-red-50 border-red-100 text-red-600',
    iconColor: 'text-red-500',
    subject: 'Keluhan Pelanggan',
    placeholder: 'Ceritakan keluhan Anda...',
    keywords: [
      'kecewa', 'buruk', 'jelek', 'tidak puas', 'protes', 'keluhan',
      'kacau', 'masalah', 'problem', 'issue', 'gangguan',
      'ditunda', 'delay', 'mundur', 'cancel', 'dibatalkan',
      'hilang', 'rusak parah', 'overdue',
      'kesal', 'marah', 'emosi', 'protest', 'ngadu', 'aduan',
      'tidak ada', 'tidak bisa', 'gagal', 'error',
      'disappointed', 'bad', 'poor', 'terrible', 'worst',
      'not good', 'not satisfied', 'complaint', 'complain',
    ],
    responses: [
      {
        priority: 1,
        trigger: 'cancel|batal|dibatalkan|pending cancel|cancel order',
        content: `Kami memahami Anda ingin membatalkan pesanan. Kami akan bantu semaksimal mungkin. 🙏

📋 **Informasi Pembatalan:**

⚠️ **Syarat Pembatalan:**
• Pesanan belum diproses / belum handed over ke kurir
• Jika sudah dikirim, tidak bisa dibatalkan langsung — perlu proses retur

📱 **Langkah Pembatalan:**
1️⃣ Kirimkan **Order ID** (format: NCO-XXXXXXXX) ke chat ini
2️⃣ Jelaskan **alasan pembatalan**
3️⃣ Tim kami akan cek status pesanan
4️⃣ Jika belum dikirim → langsung dibatalkan, refund 1-3 hari kerja
5️⃣ Jika sudah dikirim → diarahkan ke proses retur

⚠️ **Catatan:**
• Pesanan yang sudah dibayar tapi belum dikirim → refund penuh
• Pesanan dengan status "sedang dikemas" → bergantung kebijakan
• Pembatalan setelah 24 jam dari order → bergantung kondisi

Mohon kirimkan **Order ID** dan **alasan pembatalan** ya 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 2,
        trigger: 'kecewa|marah|kesal|emosi|protes|protest|tidak puas|gagal|many problems',
        content: `Kami sangat menyesal mendengar pengalaman Anda yang kurang menyenangkan. Kami minta maaf yang sebesar-besarnya atas ketidaknyamanan ini. 🙏

Setiap masukan dan keluhan Anda sangat berharga bagi kami untuk terus meningkatkan kualitas layanan.

📋 **Langkah yang Akan Kami Ambil:**
1️⃣ Tim kami akan mencatat dan menindaklanjuti keluhan Anda
2️⃣ Kami akan koordinasi dengan tim terkait untuk menyelesaikan masalah
3️⃣ Jika diperlukan, kami akan menghubungi Anda kembali via email / WhatsApp

📱 **Agar Bisa Kami Bantu Lebih Cepat:**
Mohon kirimkan informasi berikut:
• **Order ID**: NCO-XXXXXXXX
• **Detail Keluhan**: Apa yang terjadi?
• **Bukti** (foto/ screenshot jika ada)
• **Solusi yang Anda Harapkan**

Kami sangat menghargai kesabaran Anda. Tim kami akan berusaha menyelesaikan masalah ini secepat mungkin. 🙏

Mohon jangan hesitate untuk menghubungi kami lagi jika ada pertanyaan lebih lanjut.

Hormat kami,
Tim NINOC Enterprise`,
      },
      {
        priority: 3,
        trigger: 'hilang|rusak|hilang dalam perjalanan|paket hilang|lost|missing',
        content: `Kami sangat prihatin mendengar paket Anda hilang dalam perjalanan. Kami minta maaf atas ketidaknyamanannya. 🙏

📋 **Langkah Klaim Package Lost:**

1️⃣ **Verifikasi:**
   • Kirimkan **Order ID** dan **nomor resi (AWB)**
   • Kami akan cek status di sistem ekspedisi

2️⃣ **Proses Claim:**
   • Tim kami akan submit claim ke pihak ekspedisi
   • Proses verifikasi 1-7 hari kerja (tergantung kebijakan kurir)

3️⃣ **Solusi:**
   • Jika paket ditemukan → akan dikirim ulang ke alamat tujuan
   • Jika paket dinyatakan hilang → refund penuh atau kirim ulang (tergantung kebijakan)

📋 **Yang Perlu Disiapkan:**
   • Bukti foto packaging saat dikirim (dari sisi kami)
   • Foto label pengiriman
   • Deskripsi kronologi

⚠️ **Penting:**
   • Jangan dispose packaging sampai masalah terselesaikan
   • Segera laporkan jika paket tidak sampai dalam waktu estimasi + 3 hari

Mohon kirimkan **Order ID** dan **nomor resi** ke chat ini ya 🙏 — tim kami akan segera menindak lanjuti.

Tim NINOC Enterprise`,
      },
    ],
    defaultResponse: `Halo! Kami sangat menyesal mendengar keluhan Anda. Setiap masukan sangat berharga bagi kami untuk terus meningkatkan layanan. 🙏

Mohon ceritakan lebih detail agar kami bisa membantu dengan tepat:

📋 **Info yang Kami Butuhkan:**
• **Order ID**: NCO-XXXXXXXX (jika ada)
• **Masalah yang Dialami**: Ceritakan kronologi lengkap
• **Bukti**: Foto/ screenshot jika ada
• **Harapan Solusi**: Apa yang Anda inginkan?

📱 **Kami Akan:**
1️⃣ Mencatat dan memprioritaskan keluhan Anda
2️⃣ Koordinasi dengan tim terkait untuk solve
3️⃣ Memberikan update dalam 1x24 jam kerja
4️⃣ Follow-up sampai masalah terselesaikan

Kami sangat menghargai kesabaran Anda. Mohon kirimkan detail keluhan Anda 🙏

Tim NINOC Enterprise`,
  },

  // ───────────────────────────────────────────────────────────────
  // GENERAL — Pertanyaan Umum / Lainnya
  // ───────────────────────────────────────────────────────────────
  general: {
    label: 'Lainnya',
    icon: 'MessageSquare',
    color: 'bg-ink/5 border-ink/10 text-ink/60',
    iconColor: 'text-ink/40',
    subject: 'Pertanyaan Lainnya',
    placeholder: 'Ketik pertanyaan Anda...',
    keywords: [
      'halo', 'hai', 'hallo', 'hi', 'hey', 'yo',
      'pagi', 'siang', 'sore', 'malam',
      'apa kabar', 'good morning', 'good evening', 'good night', 'selamat',
      'gimana', 'gmn', 'gmn sih', 'bgaimana', 'caranya', 'caranya gimana',
      'kenapa', 'mengapa', 'apa itu', 'apa sih', 'kok', 'bisa gak', 'bisa nggak',
      'informasi', 'studio', 'ninoc', 'brand', 'tentang', 'siapa',
      'alamat', 'jam', 'buka', 'tutup', 'kontak',
      'whatsapp', 'WA', 'telepon', 'email', 'ig', 'instagram',
      'toko', 'shop', 'store', 'location', 'lokasi', 'maps',
      'how', 'what', 'when', 'where', 'who', 'why',
      'ask', 'question', 'tanya', 'bertanya',
    ],
    responses: [
      {
        priority: 1,
        trigger: 'kontak|whatsapp|wa|telepon|email|hubungi|ig|instagram|sosmed',
        content: `Halo! Terima kasih sudah menghubungi NINOC. 😊

📱 **Kontak NINOC:**

💬 **Chat Support (Paling Cepat):**
• Hubungi via chat ini — kami biasanya respon dalam 1-2 jam

📱 **WhatsApp:**
• [Nomor WA Studio] — untuk pertanyaan yang lebih urgent

📧 **Email:**
• [Email Studio] — untuk pertanyaan formal / komplain resmi

📸 **Instagram:**
• @ninoc.official — info promo, produk terbaru, dan gallery

🌐 **Website:**
• www.ninoc.store — katalog produk lengkap dan info terbaru

📍 **Alamat Toko (Walk-in):**
• [Alamat lengkap jika ada]

⏰ **Jam Operasional:**
• Senin - Jumat: 09.00 - 17.00 WIB
• Sabtu: 09.00 - 14.00 WIB
• Minggu & Hari Libur: Tutup

Kami siap membantu Anda! 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 2,
        trigger: 'jam|buka|tutup|operasional|jam operasional|lokasi|alamat|store|shop',
        content: `Halo! Terima kasih sudah bertanya. Berikut info jam operasional NINOC: 🕐

⏰ **Jam Operasional:**

🏪 **Toko / Showroom:**
• Senin - Jumat: 09.00 - 17.00 WIB
• Sabtu: 09.00 - 14.00 WIB
• Minggu & Hari Libur: Tutup

💻 **Online Shop:**
• Website: 24 jam (pesanan diproses jam kerja)
• Chat Support: 09.00 - 21.00 WIB (Senin - Sabtu)
• Email/WhatsApp: diproses jam kerja

📍 **Lokasi:**
• Website: www.ninoc.store
• Instagram: @ninoc.official
• WhatsApp: [Nomor WA]

⚠️ **Catatan:**
• Pesanan yang masuk setelah jam 15.00 WIB akan diproses hari berikutnya
• Pesanan hari Sabtu & Minggu akan diproses Senin
• Hari libur nasional = off (konfirmasi via Instagram/WhatsApp)

Ada yang bisa kami bantu? 🙏

Tim NINOC Enterprise`,
      },
      {
        priority: 3,
        trigger: 'tentang|ninoc|studio|brand|profil|company|about|siapa',
        content: `Halo! Senang bisa bertemu dengan Anda. 😊

🏪 **Tentang NINOC:**

NINOC Enterprise adalah brand fashion lokal Indonesia yang menghadirkan produk berkualitas dengan desain modern dan nyaman. Kami berkomitmen memberikan pengalaman belanja terbaik bagi setiap pelanggan.

💎 **Nilai Kami:**
• ✅ Kualitas terjamin — bahan premium dan quality control ketat
• ✅ Desain modern — mengikuti tren fashion terkini
• ✅ Harga terjangkau — quality bukan berarti mahal
• ✅ Customer service responsif — siap bantu 24/7
• ✅ Garansi & retur mudah — kebijakan customer-friendly

🎯 **Yang Kami Tawarkan:**
• Koleksi fashion lengkap (kaos, kemeja, celana, jaket, dll)
• Custom / made to order untuk group order / seragam
• Promo rutin setiap minggu
• Membership & reward point

🌐 **Temui Kami:**
• Website: www.ninoc.store
• Instagram: @ninoc.official
• WhatsApp: [Nomor WA]

Terima kasih sudah mengenal NINOC! 🙏

Tim NINOC Enterprise`,
      },
    ],
    defaultResponse: `Halo! Terima kasih telah menghubungi NINOC. Kami senang bisa membantu Anda. 😊

Silakan ceritakan pertanyaan atau kebutuhan Anda — tim kami akan memberikan respons terbaik. 🙏

📋 **Hal yang Bisa Kami Bantu:**
• ✅ Info produk & stok
• ✅ Lacak pesanan
• ✅ Ajukan retur / refund
• ✅ Masalah pembayaran
• ✅ Keluhan & komplain
• ✅ Pertanyaan umum lainnya

📱 **Atau pilih topik di bawah ini:**
• Lacak Pesanan
• Ajukan Retur
• Tanya Produk
• Masalah Bayar
• Lainnya

Kami siap membantu Anda! 🙏

Tim NINOC Enterprise`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO REPLY ENGINE — Classification & Response Logic
// ═══════════════════════════════════════════════════════════════════════════════

// Word-boundary match untuk keyword matching yang akurat
function keywordMatch(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  if (!lower.includes(keyword.toLowerCase())) return false;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\s|\\b|[,!?.:;'"-])(${escaped})(?:$|\\s|\\b|[,!?.:;'"-])`, 'i');
  return regex.test(lower);
}

// Substring match untuk category keywords
function hasKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

// Score semua kategori berdasarkan keyword match
function classifyMessage(message: string): {
  category: string;
  matchedKeywords: string[];
  score: number;
} {
  const lower = message.toLowerCase().trim();
  const scores: Record<string, { score: number; matched: string[] }> = {};

  for (const [catKey, config] of Object.entries(AUTO_REPLY_CONFIG)) {
    let score = 0;
    const matched: string[] = [];

    // Check category keywords
    for (const kw of config.keywords) {
      if (hasKeyword(lower, kw)) {
        score++;
        matched.push(kw);
      }
      // Fuzzy match untuk typo (hanya untuk keyword >= 5 karakter)
      if (kw.length >= 5) {
        const typoBase = kw.slice(0, -1); // hapus 1 karakter belakang
        if (hasKeyword(lower, typoBase) && !hasKeyword(lower, kw)) {
          score += 0.5;
        }
      }
    }

    if (score > 0) {
      scores[catKey] = { score, matched };
    }
  }

  // Ambil kategori dengan score tertinggi
  const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
  if (sorted.length === 0) {
    return { category: 'general', matchedKeywords: [], score: 0 };
  }

  return {
    category: sorted[0][0],
    matchedKeywords: sorted[0][1].matched,
    score: sorted[0][1].score,
  };
}

// Get response untuk kategori yang sudah diklasifikasi
function getResponse(category: string, message: string): string {
  const config = AUTO_REPLY_CONFIG[category];
  if (!config) return AUTO_REPLY_CONFIG.general.defaultResponse;

  // Sort responses by priority (lower number = higher priority)
  const sortedResponses = [...config.responses].sort((a, b) => a.priority - b.priority);

  for (const resp of sortedResponses) {
    const triggers = resp.trigger.split('|');
    for (const trigger of triggers) {
      if (hasKeyword(message, trigger.trim())) {
        return resp.content;
      }
    }
  }

  // Fallback ke default response
  return config.defaultResponse;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function QuickIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'Truck':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 8 23 16 16 16 16 13 1 13"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case 'RefreshCw':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
    case 'Package':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.5 3.5"/><path d="m21 21-5.97-5.97a8.04 8.04 0 0 0-.91-11.6 8.1 8.1 0 0 0-12.22 0 8.06 8.06 0 0 0 .91 11.6l5.97 5.97"/><path d="M3.27 6.96 8 12l4.73-5.04"/><path d="M20.73 17 16 12l4.73-5.04"/></svg>;
    case 'CreditCard':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>;
    case 'MessageSquare':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'AlertCircle':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  order_id: string | null;
  category: string;
  status: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_role: 'customer' | 'admin';
  message: string;
  created_at: string;
  is_auto_reply?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendAutoReply(ticketId: string, content: string): Promise<void> {
  await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_role: 'admin',
    message: content,
    is_auto_reply: true,
  });
}

async function sendCustomerNotification(ticketId: string, message: string): Promise<void> {
  await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_role: 'admin',
    message,
    is_auto_reply: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SupportChat() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'new_ticket' | 'chat'>('home');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('');
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifCard, setShowNotifCard] = useState(false);
  const [lastNotif, setLastNotif] = useState<{ subject: string; message: string } | null>(null);
  const [autoReplySentSet, setAutoReplySentSet] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUnreadRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dispatch unread count to other components
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('support-unread-count', { detail: notifCount }));
  }, [notifCount]);

  // ─── Fetch tickets
  const fetchTickets = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setTickets(data);
  }, []);

  // ─── Open ticket
  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setActiveTab('chat');
    setAutoReplySentSet(new Set());
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    hasUnreadRef.current = false;
    setNotifCount(0);
  }, []);

  // ─── Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          fetchTickets(user.id);
        }
      } catch {
        console.log('[Support] Guest mode active.');
      }
    };
    fetchUser();
  }, [fetchTickets]);

  // ─── Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('support-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: 'sender_role=eq.admin',
        },
        async (payload) => {
          const newMsg = payload.new as SupportMessage;
          const isRelevant = activeTicket?.id === newMsg.ticket_id || tickets.some(t => t.id === newMsg.ticket_id);
          if (!isRelevant) return;

          if (activeTab === 'chat' && activeTicket?.id === newMsg.ticket_id) {
            setChatMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            return;
          }

          hasUnreadRef.current = true;
          setNotifCount(prev => prev + 1);
          const relevantTicket = activeTicket?.id === newMsg.ticket_id ? activeTicket : tickets.find(t => t.id === newMsg.ticket_id);
          setLastNotif({
            subject: relevantTicket?.subject || 'Status Update',
            message: newMsg.message,
          });
          setShowNotifCard(true);
          setTimeout(() => setShowNotifCard(false), 6000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTicket, tickets, activeTab]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };
  useEffect(() => { adjustHeight(); }, [message, activeTab]);

  // Listen for external open events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-chat', handleOpen);
    return () => window.removeEventListener('open-support-chat', handleOpen);
  }, []);

  // ─── Start new ticket
  const startNewTicket = async () => {
    if (!subject || !category) return;
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id || null,
        subject,
        order_id: orderId || null,
        category,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    if (data) {
      setTickets(prev => [data, ...prev]);
      setActiveTicket(data);
      setActiveTab('chat');
      setChatMessages([]);
      setAutoReplySentSet(new Set());
      setMessage('');
      setSubject('');
      setOrderId('');
      setCategory('');
    }
  };

  // ─── Send message + auto-reply
  const processAutoReply = async (ticketId: string, msgText: string) => {
    const replyKey = `${ticketId}|${msgText}`;
    if (autoReplySentSet.has(replyKey)) return;

    setAutoReplySentSet(prev => {
      const next = new Set(prev);
      next.add(replyKey);
      return next;
    });

    // Classify message
    const { category: matchedCategory } = classifyMessage(msgText);
    const responseText = getResponse(matchedCategory, msgText);

    // Show typing indicator
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // simulate typing
    setIsTyping(false);

    // Optimistic UI update
    const autoReplyMsg: SupportMessage = {
      id: `ar-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: null,
      sender_role: 'admin',
      message: responseText,
      created_at: new Date().toISOString(),
      is_auto_reply: true,
    };
    setChatMessages(prev => [...prev, autoReplyMsg]);

    // Persist to database
    await sendAutoReply(ticketId, responseText);
  };

  const sendMessage = async (overrideMessage?: string, overrideTicket?: SupportTicket) => {
    const msgToSend = overrideMessage || message;
    const targetTicket = overrideTicket || activeTicket;

    if (!msgToSend.trim() || !targetTicket) return;

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: targetTicket.id,
        sender_id: null,
        sender_role: 'customer',
        message: msgToSend.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('[sendMessage] Supabase error:', error.code, error.message);
      return;
    }

    if (data) {
      setChatMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setMessage('');

      // Trigger auto-reply
      await processAutoReply(targetTicket.id, msgToSend.trim());
    }
  };

  // ─── General chat (no ticket, auto-creates one)
  const startGeneralChat = async () => {
    if (!message.trim()) return;

    const msgToSend = message;
    const tempId = `guest-${Date.now()}`;

    // Optimistic UI
    const optimisticMsg: SupportMessage = {
      id: tempId,
      ticket_id: tempId,
      sender_id: null,
      sender_role: 'customer',
      message: msgToSend,
      created_at: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setMessage('');

    try {
      // Check if General Inquiry ticket exists
      let genTicket = tickets.find(t => t.subject === 'General Inquiry');

      if (!genTicket) {
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user?.id || null,
            subject: 'General Inquiry',
            category: 'general',
            status: 'open',
          })
          .select()
          .single();

        if (ticketError) {
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          const errorMsg: SupportMessage = {
            id: `err-${Date.now()}`,
            ticket_id: tempId,
            sender_id: null,
            sender_role: 'admin',
            message: 'Maaf, gagal membuat tiket. Silakan coba lagi atau login terlebih dahulu.',
            created_at: new Date().toISOString(),
            is_auto_reply: true,
          };
          setChatMessages(prev => [...prev, errorMsg]);
          return;
        }

        if (ticketData) {
          genTicket = ticketData;
          setTickets(prev => [ticketData, ...prev]);
        }
      }

      if (genTicket) {
        const { data: savedMsg, error: msgError } = await supabase
          .from('support_messages')
          .insert({
            ticket_id: genTicket.id,
            sender_id: null,
            sender_role: 'customer',
            message: msgToSend,
          })
          .select()
          .single();

        if (msgError) {
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          return;
        }

        if (savedMsg) {
          setChatMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
          setActiveTicket(genTicket);
          setActiveTab('chat');
          await processAutoReply(genTicket.id, msgToSend);
        }
      }
    } catch (err) {
      console.error('[startGeneralChat] Error:', err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ─── Build QUICK_ACTIONS dari config
  const QUICK_ACTIONS = Object.entries(AUTO_REPLY_CONFIG).map(([key, config]) => ({
    id: key,
    label: config.label,
    sublabel: config.placeholder.split('...')[0].replace('Ketik ', ''),
    icon: config.icon,
    color: config.color,
    iconColor: config.iconColor,
    subject: config.subject,
    category: key,
    placeholder: config.placeholder,
  }));

  // Hide on admin page
  if (isAdminPage) return null;

  return (
    <>
      {/* ─── Notification Card ─── */}
      <AnimatePresence>
        {showNotifCard && lastNotif && activeTab !== 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 right-6 z-[600] w-[300px] bg-white rounded-2xl shadow-2xl border border-ink/5 overflow-hidden"
          >
            <div className="bg-ink px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose rounded-full animate-pulse" />
                <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/40">Studio Reply</p>
              </div>
              <button onClick={() => setShowNotifCard(false)} className="text-white/30 hover:text-white transition-colors">
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[8px] font-medium text-rose uppercase tracking-widest">New Message</p>
              <p className="text-[9px] font-medium text-ink uppercase italic">{lastNotif.subject}</p>
              <p className="text-[9px] font-medium text-ink/50 leading-relaxed line-clamp-2">{lastNotif.message}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowNotifCard(false);
                  const t = tickets.find(t => t.subject === lastNotif.subject);
                  if (t) {
                    setIsOpen(true);
                    openTicket(t);
                  }
                }}
                className="w-full bg-rose text-white py-2.5 rounded-lg text-[8px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors"
              >
                <MessageSquare size={10} /> Open Support
              </motion.button>
            </div>
            <div className="h-[2px] bg-ink/5">
              <motion.div className="h-full bg-rose" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 6, ease: 'linear' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating Button ─── */}
      <div className="fixed bottom-5 right-5 z-[500] hidden md:block">
        <AnimatePresence>
          {notifCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-rose text-white text-[8px] font-medium rounded-full w-5 h-5 flex items-center justify-center shadow-lg z-10"
            >
              {notifCount > 9 ? '9+' : notifCount}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) setShowNotifCard(false); }}
          className="relative w-9 h-9 bg-ink rounded-full shadow-lg flex items-center justify-center hover:bg-rose transition-colors duration-300"
        >
          <motion.div
            className="absolute inset-0 bg-rose rounded-full opacity-0"
            animate={notifCount > 0 ? { scale: [1, 1.4, 1], opacity: [0, 0.3, 0] } : { scale: [1, 1.3, 1], opacity: [0, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <MessageSquare size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ─── Chat Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 0, y: '100%' } : { opacity: 0, y: 8, scale: 0.96 }}
            animate={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 0, y: '100%' } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-[600] bg-white shadow-2xl overflow-hidden border border-ink/5 flex flex-col transition-all",
              "bottom-0 left-0 right-0 h-[80vh] rounded-t-3xl md:bottom-12 md:right-5 md:left-auto md:w-[300px] md:h-[480px] md:rounded-2xl"
            )}
          >
            {/* Backdrop for mobile */}
            <div className="md:hidden absolute inset-0 bg-ink/20 backdrop-blur-sm -z-10" onClick={() => setIsOpen(false)} />

            {/* Header */}
            <motion.div className="bg-ink p-4 text-white relative" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors">
                <X size={14} strokeWidth={1.5} />
              </motion.button>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/30 flex items-center gap-1.5">
                    <span className={cn("w-1 h-1 rounded-full", user ? "bg-emerald-500" : "bg-rose animate-pulse")} />
                    NINOC Support
                  </p>
                  <h3 className="text-xs font-medium uppercase tracking-widest">Support <span className="text-rose">Center</span></h3>
                </div>
                {user && (
                  <p className="text-[5px] font-medium text-white/10 uppercase tracking-widest">{user.email?.split('@')[0]}</p>
                )}
              </div>
            </motion.div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* ─── HOME TAB ─── */}
              {activeTab === 'home' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-full overflow-hidden bg-white">
                  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                    {/* Quick Action Grid */}
                    <div>
                      <p className="text-[6px] font-medium uppercase tracking-[0.15em] text-ink/30 mb-3">Pilih Topik</p>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map((action) => (
                          <motion.button
                            key={action.id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSubject(action.subject);
                              setCategory(action.category);
                              setActiveTab('new_ticket');
                            }}
                            className={cn("flex flex-col items-start gap-1.5 p-3 rounded-xl border transition-all duration-200 text-left", action.color, "hover:shadow-sm hover:-translate-y-0.5")}
                          >
                            <QuickIcon name={action.icon} className={action.iconColor} />
                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-wide leading-tight">{action.label}</p>
                              <p className="text-[7px] opacity-60 leading-snug">{action.sublabel}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Active Conversations */}
                    <div>
                      <p className="text-[6px] font-medium uppercase tracking-[0.1em] text-ink/15 mb-2">Percakapan Aktif</p>
                      {tickets.length > 0 ? (
                        <div className="space-y-1">
                          {tickets.slice(0, 5).map((t, i) => (
                            <motion.button
                              key={t.id}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => openTicket(t)}
                              className="w-full flex items-center justify-between p-2.5 bg-ink/[0.02] border border-ink/5 rounded-xl hover:bg-ink/[0.04] hover:border-ink/10 transition-all duration-200 text-left group"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-medium text-ink uppercase truncate">{t.subject}</p>
                                <p className="text-[6px] font-medium text-ink/30 uppercase tracking-widest mt-0.5">#{t.id.split('-')[0]} · {t.status}</p>
                              </div>
                              <ChevronRight size={10} className="text-ink/10 group-hover:text-rose transition-colors duration-200 ml-2 flex-shrink-0" />
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 opacity-25">
                          <MessageSquare size={18} strokeWidth={1} />
                          <p className="text-[7px] italic text-ink/40 uppercase tracking-widest">Belum ada percakapan</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Input */}
                  <div className="relative z-10 p-3 bg-white border-t border-ink/5 shrink-0">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={message}
                      onChange={e => { if (e.target.value.length <= 500) setMessage(e.target.value); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startGeneralChat(); } }}
                      placeholder="Ketik pertanyaan Anda..."
                      className="w-full bg-ink/[0.02] text-ink py-2.5 px-3.5 rounded-[5px] text-[11px] font-medium outline-none placeholder:text-ink/20 border border-ink/[0.08] transition-all focus:border-rose/30 focus:bg-white resize-none min-h-[40px]"
                    />
                    <div className="flex items-end gap-1 mt-1.5">
                      <p className="flex-1 text-[5px] text-ink/15 uppercase tracking-widest font-medium">
                        {user ? 'Studio Direct' : 'Guest Mode — chat aktif'}
                      </p>
                      <button onClick={startGeneralChat} className="flex items-center gap-1 text-[6px] uppercase tracking-widest text-ink/20 hover:text-rose transition-colors font-semibold">
                        Kirim <Send size={10} />
                      </button>
                      <span className={cn('text-[5px]', message.length > 450 ? 'text-rose font-semibold' : 'text-ink/15')}>
                        {message.length}/500
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── NEW TICKET TAB ─── */}
              {activeTab === 'new_ticket' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 space-y-3 flex-1 flex flex-col justify-center relative bg-white"
                >
                  <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab('home')} className="text-[7px] font-medium uppercase tracking-[0.2em] text-rose flex items-center gap-1 absolute top-4 left-4">
                    <ArrowLeft size={8} /> Back
                  </motion.button>
                  <div className="text-center space-y-1 mb-4 pt-6">
                    <p className="text-[6px] font-medium uppercase tracking-widest text-ink/40">Topik Terpilih</p>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink">{subject}</h4>
                  </div>
                  <div className="space-y-3 bg-ink/[0.02] p-4 rounded-xl border border-ink/5">
                    <div className="space-y-1.5 text-center">
                      <label className="text-[7px] font-medium uppercase tracking-widest text-ink/50">Punya ID Pesanan? (Opsional)</label>
                      <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Contoh: NCO-12345" className="w-full bg-white border border-ink/10 rounded-lg py-2.5 px-3 text-[10px] font-medium outline-none placeholder:text-ink/20 focus:border-rose/30 focus:shadow-sm transition-all text-center" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startNewTicket} className="w-full bg-ink text-white py-2.5 rounded-lg text-[9px] font-medium uppercase tracking-[0.2em] mt-3 hover:bg-rose transition-colors duration-200">
                      Mulai Chat
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── CHAT TAB ─── */}
              {activeTab === 'chat' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-2.5 border-b border-ink/5 flex items-center justify-between bg-white">
                    <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('home')} className="text-rose">
                      <ArrowLeft size={12} strokeWidth={1.5} />
                    </motion.button>
                    <div className="text-center">
                      <p className="text-[8px] font-medium text-ink uppercase truncate max-w-[140px]">{activeTicket?.subject}</p>
                      <p className="text-[6px] font-medium text-ink/20 uppercase tracking-widest">#{activeTicket?.id.split('-')[0]}</p>
                    </div>
                    <div className="w-4" />
                  </div>

                  {/* Messages */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar bg-ink/[0.01]">
                    {chatMessages.map((m, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[80%]">
                          <div className={`px-2.5 py-1.5 rounded-xl text-[9px] leading-relaxed ${m.sender_role === 'customer' ? 'bg-ink text-white rounded-br-none' : m.is_auto_reply ? 'bg-rose/10 border border-rose/20 text-ink rounded-bl-none' : 'bg-white border border-ink/5 text-ink rounded-bl-none'}`}>
                            {m.message}
                          </div>
                          {(m.sender_role === 'admin' || m.is_auto_reply) && (
                            <div className={`flex items-center gap-1 mt-0.5 ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                              {m.is_auto_reply ? (
                                <span className="text-[5px] text-rose/60 uppercase tracking-widest font-medium flex items-center gap-0.5">
                                  <Zap size={6} strokeWidth={2} /> Auto-reply
                                </span>
                              ) : (
                                <span className="text-[5px] text-ink/20 uppercase tracking-widest">Studio</span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="px-2.5 py-1.5 rounded-xl text-[9px] bg-ink/5 text-ink/40 rounded-bl-none flex items-center gap-1">
                          <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          <span className="ml-1">NINOC sedang mengetik...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-3 bg-white border-t border-ink/5 space-y-1.5">
                    <div className="flex items-end gap-1.5">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={e => { if (e.target.value.length <= 500) setMessage(e.target.value); }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Type message..."
                        className="flex-1 bg-ink/[0.02] border border-ink/[0.08] rounded-[5px] py-2.5 px-3.5 text-[11px] font-medium outline-none placeholder:text-ink/20 focus:bg-white focus:border-rose/30 transition-all resize-none min-h-[40px] focus:shadow-md"
                      />
                      <button onClick={() => sendMessage()} className="w-8 h-10 flex items-center justify-center text-ink/20 hover:text-rose transition-all duration-300 flex-shrink-0 active:scale-90" aria-label="Send message">
                        <Send size={13} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex justify-end px-0.5">
                      <p className={cn('text-[5.5px] font-medium tracking-widest uppercase', message.length > 450 ? 'text-rose' : 'text-ink/15')}>
                        {message.length}/500
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}