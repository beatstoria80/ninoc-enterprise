"use client";

import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Video, Shield, CheckCircle, AlertTriangle, Package, Coffee, Shirt } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import GlobalFooter from '@/components/Footer';

export default function RefundPolicyPage() {
  const [activePillar, setActivePillar] = useState<'ALL' | 'APPAREL' | 'OBJECTS' | 'PANTRY'>('ALL');

  const pillarData = {
    APPAREL: {
      code: "APR-01",
      name: "Apparel",
      icon: Shirt,
      subtitle: "Fashion, Garment & Footwear",
      returnWindow: "2 x 24 Jam (48 Jam) sejak status paket 'Diterima'",
      exchangePolicy: "Diizinkan untuk penukaran ukuran (size exchange) selama stok tersedia atau refund penuh jika terjadi cacat produksi.",
      videoRequired: "Wajib video unboxing 1-shot utuh memperlihatkan segel kemasan ziplock dan label resi tanpa terputus.",
      conditions: [
        "Produk belum pernah dipakai beraktivitas di luar fitting awal, belum dicuci, dan tidak berbau parfum/deterjen.",
        "Seluruh hangtag resmi NINOC, label woven, dan kemasan ziplock eksklusif masih terpasang utuh.",
        "Tidak mengalami perubahan bentuk, melar, atau noda yang disebabkan oleh kelalaian pembeli."
      ],
      shippingFee: "Jika cacat produksi/kesalahan kirim dari NINOC: 100% ongkir ditanggung NINOC. Jika tukar ukuran atas keinginan pembeli: ongkir ditanggung pembeli."
    },
    OBJECTS: {
      code: "OBJ-02",
      name: "Home & Living",
      icon: Package,
      subtitle: "Homeware, Ceramics & Utility Collectibles",
      returnWindow: "2 x 24 Jam (48 Jam) sejak status paket 'Diterima'",
      exchangePolicy: "Klaim kerusakan transit (pecah/retak) atau cacat pabrik akan diganti baru (replacement) atau refund penuh 100%.",
      videoRequired: "KRITIS: Wajib video unboxing 1-shot sejak paket boks ganda (double-box) masih tersegel rapat di semua sisi.",
      conditions: [
        "Khusus barang keramik/pecah belah, klaim wajib diajukan maksimal 48 jam sejak paket diterima kurir.",
        "Klaim kerusakan fisik dalam pengiriman (pecah/penyok) WAJIB memperlihatkan struktur pengaman EPE foam & bubble wrap di video unboxing.",
        "Tidak berlaku untuk kerusakan yang terjadi akibat kelalaian penggunaan atau pemakaian berlebihan oleh konsumen."
      ],
      shippingFee: "100% ongkos kirim pengembalian dan pengiriman barang pengganti (replacement) ditanggung sepenuhnya oleh NINOC."
    },
    PANTRY: {
      code: "PTR-03",
      name: "Pantry & Café",
      icon: Coffee,
      subtitle: "Specialty Coffee Beans, Pastry & F&B",
      returnWindow: "3 Jam (Instant/Sameday) atau 24 Jam (Reguler) sejak status 'Diterima'",
      exchangePolicy: "TIDAK DAPAT DIKEMBALIKAN (NON-RETURNABLE) karena regulasi keamanan pangan dan kebersihan (Hygiene & Perishable Goods).",
      videoRequired: "Wajib video unboxing jika paket tiba dalam kondisi kemasan rusak berat, bocor, atau salah kirim varian kopi/pastry.",
      conditions: [
        "Sesuai standar Google Merchant Center dan UU Perlindungan Konsumen untuk barang mudah basi/perishable, produk F&B tidak dapat diretur atas alasan selera rasa.",
        "Pengecualian retur/refund HANYA diberikan apabila: (1) Salah kirim varian/roast profile dari pihak NINOC, atau (2) Kemasan foil/valve bocor saat diterima.",
        "Klaim harus diajukan segera setelah pesanan diterima agar kualitas pangan dapat diverifikasi oleh tim roastery."
      ],
      shippingFee: "Jika terbukti salah kirim varian atau rusak transit dari pihak NINOC: 100% refund instan atau pengiriman ulang batch baru tanpa biaya tambahan."
    }
  };

  const generalSections = [
    {
      id: "GEN-01",
      title: "KEPATUHAN GOOGLE MERCHANT CENTER & HUKUM KONSUMEN",
      text: "Kebijakan pengembalian ini disusun secara spesifik per departemen pilar (Apparel, Objects, Pantry) untuk memenuhi standar verifikasi Google Merchant Center (GMC) dan Undang-Undang Perlindungan Konsumen RI No. 8 Tahun 1999. Penanganan yang berbeda di setiap pilar menjamin transparansi hak konsumen sekaligus melindungi kebersihan dan kualitas barang."
    },
    {
      id: "GEN-02",
      title: "PROSES VERIFIKASI & WAKTU PENCAIRAN REFUND (REFUND TIMELINE)",
      text: "• Pengajuan retur dilakukan melalui menu 'Retur' di navigasi bawah atau dasbor akun pelanggan.\n• Tim inspeksi Quality Control (QC) kami membutuhkan waktu 1–2 hari kerja untuk memverifikasi video unboxing dan fisik barang yang dikembalikan.\n• Setelah lolos inspeksi QC, pengembalian dana (refund) diproses dalam 1–3 hari kerja. Untuk transaksi Kartu Kredit/E-Wallet/QRIS, refund dikreditkan via Midtrans Gateway. Untuk transaksi Bank Transfer/Virtual Account, refund ditransfer langsung oleh Tim Keuangan NINOC ke nomor rekening bank/e-wallet yang dikonfirmasi oleh pembeli."
    },
    {
      id: "GEN-03",
      title: "ALAMAT PENERIMAAN RETUR GUDANG PUSAT",
      text: "NINOC ENTERPRISE CENTRAL HUB (STUDIO & ROASTERY)\nKompleks Griya Saluyu, Blok AA No.87, Mekarjaya, Kec. Rancasari, Kota Bandung, Jawa Barat 40292, Indonesia\n\nEmail Layanan Resmi: ninocenterprise@gmail.com | WhatsApp Support: +62 821-1983-774"
    }
  ];

  return (
    <main className="min-h-screen bg-[#111111] text-[#E5E5E5] flex flex-col font-sans selection:bg-rose selection:text-white">
      {/* KITH Style Header */}
      <nav className="fixed top-0 inset-x-0 z-[200] px-6 md:px-12 py-4 flex items-center justify-between bg-[#111111]/90 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 text-white/60 hover:text-rose transition-all group">
          <ArrowLeft size={14} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] md:text-[8px] font-mono uppercase tracking-[0.2em] text-white/40">Studio Exit</span>
            <span className="text-xs md:text-[10px] font-bold uppercase tracking-widest text-white">Back to Store</span>
          </div>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-xs md:text-sm font-display font-medium italic tracking-tighter text-rose uppercase">NINOC // POLICIES</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1">
          <Shield size={12} />
          <span className="hidden md:inline uppercase">GMC Compliant Ver 3.1</span>
        </div>
      </nav>

      <div className="flex-1 min-h-0 pt-24 md:pt-28 pb-16 px-6 md:px-12 flex flex-col max-w-[1400px] mx-auto w-full">
        {/* Editorial Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-white/15 pb-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose font-mono text-[10px] tracking-[0.3em] uppercase">
              <span>Department Portal Protocol</span>
              <span>{"//"}</span>
              <span>Return & Refund SLA</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-medium italic tracking-tighter text-white uppercase leading-none">
              KEBIJAKAN RETUR & REFUND SPESIFIK PILAR
            </h1>
          </div>
          <p className="text-xs md:text-sm text-white/60 max-w-md font-mono leading-relaxed">
            Standar penanganan retur dan garansi yang disesuaikan dengan regulasi Google Merchant Center untuk setiap kategori produk di NINOC Enterprise Store.
          </p>
        </div>

        {/* Pillar Switcher Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-10">
          {[
            { id: 'ALL', label: 'SEMUA PILAR // SUMMARY', code: 'ALL-00' },
            { id: 'APPAREL', label: 'APPAREL', code: 'APR-01' },
            { id: 'OBJECTS', label: 'HOME & LIVING', code: 'OBJ-02' },
            { id: 'PANTRY', label: 'PANTRY & CAFÉ', code: 'PTR-03' },
          ].map((tab) => {
            const isActive = activePillar === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePillar(tab.id as any)}
                className={`p-3 md:p-4 text-left transition-all border flex flex-col justify-between h-20 md:h-24 ${
                  isActive
                    ? 'bg-rose text-white border-rose shadow-lg scale-[1.01]'
                    : 'bg-[#181818] text-white/70 border-white/10 hover:border-white/30 hover:bg-[#202020]'
                }`}
              >
                <span className={`text-[9px] font-mono tracking-widest ${isActive ? 'text-white/80' : 'text-rose'}`}>
                  [{tab.code}]
                </span>
                <span className="text-xs md:text-sm font-bold uppercase tracking-tight line-clamp-1 font-display">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Specific Matrix Content */}
        <div className="space-y-8 mb-12">
          {Object.entries(pillarData).map(([key, pillar]) => {
            if (activePillar !== 'ALL' && activePillar !== key) return null;
            const Icon = pillar.icon;
            const isPantry = key === 'PANTRY';

            return (
              <div
                key={key}
                className={`p-6 md:p-8 border rounded-none transition-all ${
                  isPantry
                    ? 'bg-gradient-to-br from-[#1c1412] to-[#14100e] border-amber-600/30'
                    : 'bg-[#181818] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-rose">
                      <Icon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-rose/20 text-rose font-bold uppercase">
                          {pillar.code}
                        </span>
                        <h2 className="text-lg md:text-xl font-display font-bold uppercase tracking-tight text-white">
                          {pillar.name}
                        </h2>
                      </div>
                      <p className="text-xs text-white/50 font-mono mt-0.5">{pillar.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-3 py-1 border border-white/15 bg-black/40 text-white/80">
                      Batas Klaim: <strong className="text-rose">{pillar.returnWindow}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Exchange & Return Rule */}
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose flex items-center gap-1.5">
                      <RefreshCw size={14} /> Kebijakan Penukaran & Refund
                    </h3>
                    <p className="text-xs md:text-sm text-white/80 leading-relaxed bg-black/30 p-3.5 border border-white/5 h-full">
                      {pillar.exchangePolicy}
                    </p>
                  </div>

                  {/* Column 2: Video Unboxing Requirement */}
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Video size={14} /> Syarat Video Unboxing
                    </h3>
                    <p className="text-xs md:text-sm text-white/80 leading-relaxed bg-black/30 p-3.5 border border-white/5 h-full">
                      {pillar.videoRequired}
                    </p>
                  </div>

                  {/* Column 3: Shipping Fee Liability */}
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Biaya Ongkos Kirim Retur
                    </h3>
                    <p className="text-xs md:text-sm text-white/80 leading-relaxed bg-black/30 p-3.5 border border-white/5 h-full">
                      {pillar.shippingFee}
                    </p>
                  </div>
                </div>

                {/* Eligible Conditions List */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-3">
                    Kondisi Barang yang Diterima (Eligibility Checklist):
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {pillar.conditions.map((cond, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-white/70 bg-white/[0.02] p-3 border border-white/[0.05]">
                        <span className="text-rose font-mono font-bold">[{idx + 1}]</span>
                        <span className="leading-relaxed">{cond}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* General Regulatory Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {generalSections.map((sec) => (
            <div key={sec.id} className="p-6 bg-[#181818] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xs font-mono font-bold text-rose">{sec.id}</span>
                <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">{sec.title}</h3>
              </div>
              <p className="text-xs text-white/70 whitespace-pre-line leading-relaxed font-sans">
                {sec.text}
              </p>
            </div>
          ))}
        </div>

        {/* Google Merchant Center Compliance Banner */}
        <div className="p-6 bg-gradient-to-r from-rose/20 via-black to-rose/10 border border-rose/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose text-white">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-display font-bold uppercase tracking-tight text-white">
                VERIFIKASI GOOGLE MERCHANT CENTER (GMC) APPROVED
              </h4>
              <p className="text-xs text-white/70 max-w-2xl font-mono mt-0.5">
                Kebijakan penolakan retur pada produk makanan/minuman (Pantry & Café) telah selaras dengan pasal pengecualian barang mudah basi dalam kebijakan GMC & UU No. 8/1999 pasal 4.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="px-6 py-3 bg-white text-black font-mono font-bold text-xs uppercase tracking-widest hover:bg-rose hover:text-white transition-all whitespace-nowrap"
          >
            Explore Department Pillars →
          </Link>
        </div>
      </div>

      <GlobalFooter />
    </main>
  );
}
