export interface ReplyCategory {
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

export const AUTO_REPLY_CONFIG: Record<string, ReplyCategory> = {
  shipping: {
    label: 'Lacak Pesanan',
    icon: 'Truck',
    color: 'bg-blue-50 border-blue-100',
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
  return: {
    label: 'Ajukan Retur',
    icon: 'RefreshCw',
    color: 'bg-rose-50 border-rose-100',
    iconColor: 'text-rose-500',
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
• depends on bank masing-masing
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
  product: {
    label: 'Tanya Produk',
    icon: 'Package',
    color: 'bg-purple-50 border-purple-100',
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
  payment: {
    label: 'Masalah Bayar',
    icon: 'CreditCard',
    color: 'bg-amber-50 border-amber-100',
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
2️⃣ **VA expired** — Virtual Account kedaluwarsa (24 jam setelah generate)
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
  complaint: {
    label: 'Keluhan',
    icon: 'AlertCircle',
    color: 'bg-red-50 border-red-100',
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
  general: {
    label: 'Lainnya',
    icon: 'MessageSquare',
    color: 'bg-zinc-50 border-zinc-100',
    iconColor: 'text-zinc-500',
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

export function keywordMatch(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  if (!lower.includes(keyword.toLowerCase())) return false;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\s|\\b|[,!?.:;'"-])(${escaped})(?:$|\\s|\\b|[,!?.:;'"-])`, 'i');
  return regex.test(lower);
}

export function hasKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export function classifyMessage(message: string): {
  category: string;
  matchedKeywords: string[];
  score: number;
} {
  const lower = message.toLowerCase().trim();
  const scores: Record<string, { score: number; matched: string[] }> = {};

  for (const [catKey, config] of Object.entries(AUTO_REPLY_CONFIG)) {
    let score = 0;
    const matched: string[] = [];

    for (const kw of config.keywords) {
      if (hasKeyword(lower, kw)) {
        score++;
        matched.push(kw);
      }
      if (kw.length >= 5) {
        const typoBase = kw.slice(0, -1);
        if (hasKeyword(lower, typoBase) && !hasKeyword(lower, kw)) {
          score += 0.5;
        }
      }
    }

    if (score > 0) {
      scores[catKey] = { score, matched };
    }
  }

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

export function getResponse(category: string, message: string): string {
  const config = AUTO_REPLY_CONFIG[category];
  if (!config) return AUTO_REPLY_CONFIG.general.defaultResponse;

  const sortedResponses = [...config.responses].sort((a, b) => a.priority - b.priority);

  for (const resp of sortedResponses) {
    const triggers = resp.trigger.split('|');
    for (const trigger of triggers) {
      if (hasKeyword(message, trigger.trim())) {
        return resp.content;
      }
    }
  }

  return config.defaultResponse;
}
