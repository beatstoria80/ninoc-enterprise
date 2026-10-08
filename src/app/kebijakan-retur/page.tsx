import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, RefreshCw, Clock, Video, CheckCircle, ArrowLeft } from 'lucide-react';

const BASE_URL = (() => {
  let url = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
  if (!url.startsWith('http')) url = `https://${url}`;
  return url;
})();

export const metadata: Metadata = {
  title: 'Kebijakan Retur & Pengembalian Barang — NINOC STORE',
  description:
    'Kebijakan retur dan pengembalian barang NINOC STORE. Periode pengembalian 7 hari sejak barang diterima. Gratis biaya pengembalian untuk cacat produksi.',
  alternates: {
    canonical: `${BASE_URL}/kebijakan-retur`,
  },
  openGraph: {
    title: 'Kebijakan Retur & Pengembalian | NINOC STORE',
    description: 'Periode pengembalian 7 hari. Gratis biaya retur untuk cacat produksi.',
    type: 'website',
    url: `${BASE_URL}/kebijakan-retur`,
  },
};

const returnPolicyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MerchantReturnPolicy',
  name: 'Kebijakan Pengembalian Barang NINOC STORE',
  url: `${BASE_URL}/kebijakan-retur`,
  applicableCountry: 'ID',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 7,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
  refundType: 'https://schema.org/FullRefund',
  merchantReturnLink: `${BASE_URL}/retur`,
};

const pillars = [
  {
    code: 'APR-01',
    name: 'Apparel',
    subtitle: 'Fashion, Garment & Footwear',
    emoji: '👕',
    returnDays: 7,
    note: 'Klaim dalam 2x24 jam sejak paket berstatus Diterima. Refund diproses 3-7 hari kerja.',
    conditions: [
      'Produk belum pernah dipakai, belum dicuci, tidak berbau parfum/deterjen.',
      'Hangtag resmi NINOC, label woven, dan kemasan ziplock masih terpasang utuh.',
      'Tidak terdapat perubahan bentuk atau noda akibat kelalaian pembeli.',
    ],
    returnFee: 'Gratis jika cacat produksi atau salah kirim dari NINOC. Ongkir tukar ukuran ditanggung pembeli.',
    nonReturnable: false,
  },
  {
    code: 'OBJ-02',
    name: 'Home & Living',
    subtitle: 'Homeware, Ceramics & Utility Collectibles',
    emoji: '🏡',
    returnDays: 7,
    note: 'Klaim kerusakan transit diajukan maksimal 48 jam sejak barang diterima.',
    conditions: [
      'Barang keramik: klaim wajib dalam 48 jam sejak diterima.',
      'Video unboxing 1-shot wajib memperlihatkan boks ganda yang masih tersegel.',
      'Tidak berlaku untuk kerusakan akibat kelalaian penggunaan oleh konsumen.',
    ],
    returnFee: 'Gratis — 100% ongkos kirim pengembalian dan pengiriman barang pengganti ditanggung NINOC.',
    nonReturnable: false,
  },
  {
    code: 'PTR-03',
    name: 'Pantry & Cafe',
    subtitle: 'Specialty Coffee Beans, Pastry & F&B',
    emoji: '☕',
    returnDays: 0,
    note: 'Produk perishable tidak dapat diretur atas alasan selera rasa sesuai regulasi keamanan pangan.',
    conditions: [
      'Retur HANYA diterima jika: salah kirim varian dari pihak NINOC, atau kemasan bocor saat diterima.',
      'Klaim diajukan segera setelah pesanan diterima.',
      'Sesuai standar Google Merchant Center dan UU Perlindungan Konsumen RI No. 8 Tahun 1999.',
    ],
    returnFee: 'Refund penuh atau pengiriman ulang gratis jika terbukti salah kirim atau rusak transit dari NINOC.',
    nonReturnable: true,
  },
];

export default function KebijakanReturPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(returnPolicyJsonLd) }}
      />

      <main className="min-h-screen bg-[#111111] text-[#E5E5E5] font-sans">
        <nav className="sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between bg-[#111111]/95 backdrop-blur-md border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
            <ArrowLeft size={14} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-medium uppercase tracking-widest">NINOC STORE</span>
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1">
            <Shield size={11} />
            <span className="uppercase">GMC Compliant</span>
          </div>
        </nav>

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-12 pb-20">

          <section className="mb-14 border-b border-white/10 pb-10">
            <p className="text-rose font-mono text-[10px] tracking-[0.3em] uppercase mb-3">Ninoc Enterprise // Kebijakan Resmi</p>
            <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-white leading-none mb-4">
              Kebijakan Retur &amp; Pengembalian Barang
            </h1>
            <p className="text-sm md:text-base text-white/60 max-w-2xl leading-relaxed">
              Periode pengembalian barang adalah <strong className="text-white">7 (tujuh) hari</strong> sejak
              barang diterima oleh pembeli. Kebijakan ini berlaku untuk semua produk di NINOC STORE dan
              telah selaras dengan standar Google Merchant Center serta Undang-Undang Perlindungan Konsumen RI No. 8 Tahun 1999.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              {[
                { label: 'Periode Retur', value: '7 Hari', sub: 'Sejak barang diterima', color: 'text-emerald-400' },
                { label: 'Biaya Retur', value: 'Gratis', sub: 'Cacat produksi / salah kirim', color: 'text-emerald-400' },
                { label: 'Refund', value: '3-7 Hari Kerja', sub: 'Setelah QC disetujui', color: 'text-white' },
                { label: 'Wilayah', value: 'Indonesia', sub: 'Semua kota dan provinsi', color: 'text-white' },
              ].map((card) => (
                <div key={card.label} className="p-4 bg-white/[0.03] border border-white/10 rounded-sm">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/40 mb-1">{card.label}</p>
                  <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-[9px] text-white/50 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-rose mb-6">01 — Persyaratan Umum Pengajuan Retur</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: 'Clock',
                  title: 'Periode Klaim: 7 Hari',
                  desc: 'Pengajuan retur dilakukan maksimal 7 (tujuh) hari kalender sejak tanggal barang dinyatakan Diterima oleh kurir. Klaim di luar batas waktu ini tidak dapat diproses.',
                  border: 'border-l-2 border-emerald-500',
                },
                {
                  icon: 'Video',
                  title: 'Bukti Video 1-Shot',
                  desc: 'Wajib menyertakan video unboxing 1-shot tanpa jeda, cut, atau edit. Video harus memperlihatkan kondisi paket dari awal pembukaan hingga barang terlihat seluruhnya.',
                  border: 'border-l-2 border-amber-500',
                },
                {
                  icon: 'RefreshCw',
                  title: 'Kondisi Barang',
                  desc: 'Barang yang dikembalikan harus dalam kondisi asli: belum dipakai, belum dicuci, seluruh label/tag masih terpasang, dan dalam kemasan asli.',
                  border: 'border-l-2 border-white/30',
                },
              ].map((item) => (
                <div key={item.title} className={`p-5 bg-[#181818] border border-white/10 ${item.border}`}>
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-rose mb-6">02 — Kebijakan Retur Per Departemen</h2>
            <div className="space-y-4">
              {pillars.map((pillar) => (
                <div key={pillar.code} className={`p-6 border ${pillar.nonReturnable ? 'bg-amber-950/20 border-amber-600/20' : 'bg-[#181818] border-white/10'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pillar.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono bg-rose/20 text-rose px-2 py-0.5">{pillar.code}</span>
                          <h3 className="text-base font-bold text-white">{pillar.name}</h3>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono">{pillar.subtitle}</p>
                      </div>
                    </div>
                    <div className={`text-xs font-mono px-3 py-1.5 border ${pillar.nonReturnable ? 'text-amber-400 border-amber-600/30 bg-amber-950/40' : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30'}`}>
                      {pillar.nonReturnable ? 'NON-RETURNABLE (F&B/Perishable)' : `Periode Retur: ${pillar.returnDays} Hari`}
                    </div>
                  </div>
                  <p className="text-xs text-white/70 mb-4 leading-relaxed italic border-l-2 border-white/20 pl-3">{pillar.note}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Syarat Eligibilitas</h4>
                      <ul className="space-y-1.5">
                        {pillar.conditions.map((cond, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                            <CheckCircle size={10} className="text-rose mt-0.5 shrink-0" />
                            <span>{cond}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Biaya Pengembalian</h4>
                      <p className="text-xs text-white/70 leading-relaxed bg-white/[0.02] border border-white/5 p-3">{pillar.returnFee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-rose mb-6">03 — Proses dan Timeline Refund</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { step: '01', title: 'Ajukan Retur', desc: 'Isi form retur di ninoc.store/retur dengan Order ID dan upload video unboxing 1-shot.', time: 'Hari 1-7' },
                { step: '02', title: 'Verifikasi QC', desc: 'Tim Quality Control kami memverifikasi video dan kondisi barang yang dikembalikan.', time: '1-2 hari kerja' },
                { step: '03', title: 'Persetujuan', desc: 'Notifikasi persetujuan atau penolakan dikirim via email dan WhatsApp ke pembeli.', time: 'Hari ke-3' },
                { step: '04', title: 'Pencairan Refund', desc: 'Refund dikreditkan via Midtrans (e-wallet/kartu) atau transfer bank langsung dari NINOC.', time: '3-7 hari kerja' },
              ].map((item) => (
                <div key={item.step} className="p-4 bg-[#181818] border border-white/10">
                  <span className="text-[9px] font-mono text-rose">{item.time}</span>
                  <p className="text-2xl font-bold text-white/10 font-mono my-1">{item.step}</p>
                  <h3 className="text-xs font-bold text-white uppercase tracking-tight mb-2">{item.title}</h3>
                  <p className="text-[10px] text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-rose mb-6">04 — Alamat Pengembalian Barang dan Kontak</h2>
            <div className="p-6 bg-[#181818] border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">Gudang Penerimaan Retur</h3>
                  <address className="not-italic text-sm text-white/80 leading-relaxed">
                    <strong className="text-white">NINOC ENTERPRISE CENTRAL HUB</strong><br />
                    Studio dan Roastery<br />
                    Kompleks Griya Saluyu, Blok AA No.87<br />
                    Mekarjaya, Kec. Rancasari<br />
                    Kota Bandung, Jawa Barat 40292<br />
                    Indonesia
                  </address>
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">Kontak Layanan Retur</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-white/80">
                      <span className="text-white/40 text-[10px] font-mono block">Email</span>
                      ninocenterprise@gmail.com
                    </p>
                    <p className="text-sm text-white/80">
                      <span className="text-white/40 text-[10px] font-mono block">WhatsApp Support</span>
                      +62 821-1983-774
                    </p>
                    <p className="text-sm text-white/80">
                      <span className="text-white/40 text-[10px] font-mono block">Portal Pengajuan Retur</span>
                      <Link href="/retur" className="text-rose hover:underline">ninoc.store/retur</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center gap-4">
            <Shield size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Kepatuhan Google Merchant Center dan Hukum Perlindungan Konsumen</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Kebijakan ini disusun untuk memenuhi persyaratan Google Merchant Center (GMC) dan Undang-Undang Perlindungan Konsumen RI No. 8 Tahun 1999.{' '}
                <strong className="text-white">Periode pengembalian: 7 hari. Biaya retur: Gratis (cacat produksi).</strong>{' '}
                Untuk pengajuan retur aktif, kunjungi{' '}
                <Link href="/retur" className="text-emerald-400 hover:underline">ninoc.store/retur</Link>.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-white/30 font-mono mt-8 text-center">
            Kebijakan ini berlaku efektif sejak 1 Januari 2025. Versi terbaru tersedia di ninoc.store/kebijakan-retur
          </p>
        </div>
      </main>
    </>
  );
}