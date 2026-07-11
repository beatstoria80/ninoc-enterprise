import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Kebijakan penggunaan Cookie (Cookie Policy) pada platform NINOC Enterprise.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl font-display uppercase">Cookie Policy</h1>
          <p className="mt-4 text-base text-neutral-500">
            Pembaruan Terakhir: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral prose-lg max-w-none text-neutral-600">
          
          <p>
            Di <strong>NINOC Enterprise</strong> (selanjutnya disebut &quot;NINOC&quot;, &quot;kami&quot;, &quot;milik kami&quot;), kami menghargai privasi Anda dan berkomitmen untuk melindunginya. Kebijakan Cookie ini menjelaskan apa itu cookie, bagaimana kami menggunakannya di situs web kami (<code>ninoc.store</code>), dan pilihan yang Anda miliki terkait penggunaannya.
          </p>

          <h2 className="text-xl font-bold text-neutral-900 mt-10 mb-4 uppercase tracking-wide text-sm border-b pb-2">1. Apa itu Cookie?</h2>
          <p>
            Cookie adalah file teks kecil yang disimpan di komputer atau perangkat seluler Anda saat Anda mengunjungi situs web. Cookie ini secara luas digunakan agar situs web berfungsi dengan semestinya, serta untuk memberikan informasi bisnis dan analitik kepada pemilik situs web.
          </p>

          <h2 className="text-xl font-bold text-neutral-900 mt-10 mb-4 uppercase tracking-wide text-sm border-b pb-2">2. Bagaimana NINOC Menggunakan Cookie?</h2>
          <p>
            Sistem platform NINOC bukan sekadar halaman statis, melainkan ekosistem <em>e-commerce</em> penuh. Kami menggunakan cookie untuk memastikan fungsionalitas inti berjalan dengan lancar (seperti menyimpan isi keranjang belanja dan status login), serta untuk menganalisis bagaimana pengunjung berinteraksi dengan situs kami guna meningkatkan pengalaman berbelanja.
          </p>

          <h2 className="text-xl font-bold text-neutral-900 mt-10 mb-4 uppercase tracking-wide text-sm border-b pb-2">3. Jenis Cookie yang Kami Gunakan</h2>
          <ul className="space-y-4">
            <li>
              <strong className="text-neutral-900">Cookie Esensial (Strictly Necessary):</strong><br />
              Cookie ini mutlak diperlukan agar situs web berfungsi dengan baik. Di NINOC, cookie esensial meliputi:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Autentikasi (Supabase Auth):</strong> Digunakan untuk mempertahankan sesi login Anda dengan aman dan memverifikasi identitas (mencegah CSRF).</li>
                <li><strong>Manajemen Keranjang (Cart State):</strong> Menyimpan data sementara tentang barang yang Anda tambahkan ke keranjang sebelum Anda melakukan <em>checkout</em>.</li>
                <li><strong>Keamanan (Cloudflare Turnstile):</strong> Digunakan untuk membedakan pengguna asli dari bot otomatis untuk mencegah serangan <em>spam</em> dan DDoS.</li>
              </ul>
            </li>
            <li>
              <strong className="text-neutral-900">Cookie Analitik & Performa:</strong><br />
              Kami menggunakan <strong>Google Analytics</strong> dan <strong>Google Tag Manager</strong> untuk mengumpulkan informasi anonim tentang bagaimana pengunjung menggunakan situs web kami. Cookie ini melacak metrik seperti jumlah pengunjung, halaman yang paling sering dilihat, dan sumber lalu lintas. Informasi ini membantu kami memahami perilaku pelanggan dan memperbaiki performa situs kami.
            </li>
            <li>
              <strong className="text-neutral-900">Cookie Fungsionalitas:</strong><br />
              Digunakan untuk mengingat preferensi Anda (misalnya: preferensi bahasa atau pilihan Anda saat menyembunyikan <em>Cookie Consent Banner</em> melalui <code>localStorage</code>) sehingga Anda tidak perlu terus-menerus mengatur ulang preferensi setiap kali berkunjung.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-neutral-900 mt-10 mb-4 uppercase tracking-wide text-sm border-b pb-2">4. Cookie Pihak Ketiga (Third-Party Cookies)</h2>
          <p>
            Dalam beberapa kasus khusus, kami juga menggunakan cookie yang disediakan oleh pihak ketiga tepercaya. Selain Google Analytics, saat Anda melakukan proses <em>checkout</em>, mitra <em>Payment Gateway</em> kami (<strong>Midtrans</strong>) mungkin menggunakan cookie tersendiri pada komponen <em>Snap Popup</em> mereka untuk memproses transaksi dengan aman, mendeteksi penipuan, dan mengamankan jalur pembayaran Anda.
          </p>

          <h2 className="text-xl font-bold text-neutral-900 mt-10 mb-4 uppercase tracking-wide text-sm border-b pb-2">5. Manajemen dan Kontrol Cookie Anda</h2>
          <p>
            Anda memiliki hak penuh untuk menerima atau menolak penggunaan cookie (selain Cookie Esensial yang diperlukan sistem untuk berjalan). 
            Melalui <em>Cookie Consent Banner</em> yang muncul di bagian bawah layar Anda, Anda dapat memilih untuk <strong>Accept All Cookies</strong> atau mengatur preferensi Anda dengan <strong>Manage Cookies</strong>.
          </p>
          <p>
            Selain itu, Anda dapat mengatur browser Anda untuk memblokir cookie atau memberi peringatan ketika cookie dikirimkan. Namun, perlu dicatat bahwa jika Anda memblokir <strong>Cookie Esensial</strong>, Anda mungkin tidak akan dapat masuk (<em>login</em>) ke akun Anda, menambahkan barang ke keranjang, atau memproses pembayaran.
          </p>
          <p>
            Untuk mengetahui lebih lanjut tentang cara mengontrol pengaturan cookie browser, silakan kunjungi situs bantuan resmi browser Anda (misalnya Chrome, Safari, atau Firefox).
          </p>

          <h2 className="text-xl font-bold text-neutral-900 mt-10 mb-4 uppercase tracking-wide text-sm border-b pb-2">6. Hubungi Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan mengenai penggunaan Cookie ini atau bagaimana kami menangani privasi data Anda, silakan hubungi tim dukungan kami:
          </p>
          <ul className="list-none pl-0 space-y-2 mt-4">
            <li><strong>Email:</strong> ninocenterprise@gmail.com</li>
            <li><strong>WhatsApp (CS):</strong> +62 821-1983-774</li>
            <li><strong>Alamat Kantor:</strong> Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya RANCASARI, Bandung, Jawa Barat 40292, Indonesia</li>
          </ul>

        </div>
      </div>
    </div>
  );
}
