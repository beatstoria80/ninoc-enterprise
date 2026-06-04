"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface HelpSection {
  key: string;
  label: string;
  icon: string;
}

const HELP_SECTIONS: HelpSection[] = [
  { key: 'help_guide_customer_care', label: 'Customer Care', icon: 'CS' },
  { key: 'help_guide_payment', label: 'Payment', icon: 'PY' },
  { key: 'help_guide_return', label: 'Return & Refund', icon: 'RT' },
  { key: 'help_guide_shipping', label: 'Shipping', icon: 'SH' },
  { key: 'help_guide_how_to_order', label: 'How to Order', icon: 'HO' },
  { key: 'help_guide_how_to_track', label: 'Tracking', icon: 'TR' },
  { key: 'help_guide_terms', label: 'Terms', icon: 'TC' },
  { key: 'help_guide_privacy', label: 'Privacy', icon: 'PP' },
];

// Default fallback content for each section (shown when DB has no saved data)
const DEFAULT_VALUES: Record<string, any> = {
  help_guide_customer_care: {
    wa: '08211983774',
    email: 'cs@ninoc.id',
    hours: 'Senin–Sabtu, 08.00–17.00 WIB',
    notes: 'Untuk pertanyaan mengenai pembayaran, retur, atau refund, silakan hubungi customer service kami melalui WhatsApp.',
  },
  help_guide_payment: {
    guide: 'Kami menyediakan berbagai metode pembayaran yang aman dan mudah untuk kenyamanan Anda.\n\nMetode Pembayaran yang Tersedia:\n\n• Transfer Bank (BCA, Mandiri, BRI, BNI)\n• Virtual Account\n• QRIS\n• Kartu Debit/Kredit (jika tersedia)\n\nProses Pembayaran:\n\n1. Pilih produk yang ingin dibeli.\n2. Lanjutkan ke halaman checkout.\n3. Pilih metode pembayaran yang diinginkan.\n4. Ikuti instruksi pembayaran.\n5. Setelah pembayaran berhasil, pesanan akan otomatis diproses.',
    accounts: [],
  },
  help_guide_return: {
    policy: 'Kepuasan pelanggan adalah prioritas kami. Jika produk yang Anda terima tidak sesuai, rusak, atau terdapat kesalahan pengiriman, Anda dapat mengajukan retur atau refund sesuai ketentuan berikut.\n\nSyarat Pengajuan:\n\n• Produk diterima dalam kondisi rusak atau cacat.\n• Produk yang dikirim tidak sesuai dengan pesanan.\n• Pengajuan dilakukan maksimal 3 x 24 jam setelah barang diterima.\n• Produk belum digunakan dan masih dalam kondisi lengkap.',
    process: '1. Hubungi customer service kami melalui WhatsApp.\n2. Sertakan nomor pesanan, foto produk, dan penjelasan kendala.\n3. Tim kami akan melakukan verifikasi.\n4. Jika disetujui, kami akan memberikan instruksi pengembalian barang atau proses refund.\n\nEstimasi Proses:\n\n• Verifikasi: 1–2 hari kerja\n• Refund: 3–7 hari kerja setelah persetujuan',
    notes: 'Refund akan dikembalikan melalui metode pembayaran awal atau transfer bank. Biaya pengiriman retur ditanggung sesuai hasil verifikasi.',
  },
  help_guide_shipping: {
    info: 'Terima kasih telah berbelanja di toko kami.\n\nKami memproses pesanan setiap hari kerja (Senin–Sabtu) pukul 08.00–17.00 WIB.\n\nEstimasi Pengiriman:\n\nJabodetabek: 1–2 hari kerja\nPulau Jawa: 2–4 hari kerja\nLuar Pulau Jawa: 3–7 hari kerja\n\nKetentuan Pengiriman:\n\n• Pesanan yang masuk sebelum pukul 15.00 WIB akan diproses di hari yang sama.\n• Nomor resi akan dikirim otomatis setelah pesanan dikirim.',
    area: 'Kami mengirim ke seluruh Indonesia',
  },
  help_guide_how_to_order: 'Ikuti langkah mudah berikut untuk melakukan pemesanan:\n\n1. Pilih produk yang ingin Anda beli.\n2. Klik tombol Tambah ke Keranjang atau Beli Sekarang.\n3. Masukkan jumlah produk yang diinginkan.\n4. Isi data pengiriman dengan lengkap.\n5. Pilih metode pembayaran yang tersedia.\n6. Klik Buat Pesanan.\n7. Lakukan pembayaran sesuai instruksi.\n8. Pesanan Anda akan segera kami proses setelah pembayaran terverifikasi.\n\nCatatan:\n\n• Pastikan alamat dan nomor WhatsApp yang Anda masukkan sudah benar.\n• Simpan nomor pesanan untuk memudahkan pengecekan status.',
  help_guide_how_to_track: 'Setelah pesanan Anda dikirim, kami akan memberikan nomor resi pengiriman melalui WhatsApp atau email yang terdaftar.\n\nCara Melacak Pesanan:\n\n1. Salin nomor resi yang telah kami kirimkan.\n2. Kunjungi website resmi jasa pengiriman yang digunakan.\n3. Masukkan nomor resi pada kolom pelacakan.\n4. Klik tombol Lacak.\n5. Informasi status pengiriman akan ditampilkan oleh pihak ekspedisi.',
  help_guide_terms: 'Dengan mengakses dan bertransaksi di toko kami, Anda dianggap telah membaca, memahami, dan menyetujui syarat dan ketentuan berikut:\n\nKetentuan Umum\n\n• Seluruh harga produk ditampilkan dalam Rupiah (IDR).\n• Stok dan harga produk dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.\n• Pesanan akan diproses setelah pembayaran berhasil diterima dan diverifikasi.\n• Pembeli wajib memastikan data pemesanan dan alamat pengiriman sudah benar.',
  help_guide_privacy: 'Kami menghargai kepercayaan Anda dan berkomitmen untuk menjaga keamanan serta kerahasiaan setiap data pribadi yang diberikan saat menggunakan layanan dan melakukan transaksi di toko kami.\n\nInformasi yang kami kumpulkan digunakan secara terbatas untuk keperluan:\n\n• Pemrosesan dan konfirmasi pesanan\n• Pengiriman produk\n• Verifikasi pembayaran\n• Layanan pelanggan dan penanganan keluhan',
};

interface SettingItem {
  key: string;
  value: any;
}

function SectionContent({ value, sectionKey }: { value: any; sectionKey: string }) {
  if (!value) return null;

  // Object with guide + accounts (payment)
  if (typeof value === 'object' && value.guide) {
    return (
      <div className="space-y-4">
        <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">
          {value.guide}
        </p>
        {value.accounts?.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-ink/5 pt-4">
            <p className="text-[8px] uppercase tracking-widest font-semibold text-ink/30 mb-2">Rekening Tujuan</p>
            {value.accounts.map((acc: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 border border-ink/5 bg-ink/[0.02]">
                <span className="text-[8px] font-medium text-rose/40 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[10px] font-medium text-ink/70">{acc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Object with info + area (shipping)
  if (typeof value === 'object' && value.info) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">
          {value.info}
        </p>
        {value.area && (
          <p className="text-[9px] font-semibold text-ink/40 uppercase tracking-widest border-t border-ink/5 pt-3">
            {value.area}
          </p>
        )}
      </div>
    );
  }

  // Object with wa/email/hours/notes (customer care)
  if (typeof value === 'object' && (value.wa || value.email || value.hours)) {
    return (
      <div className="space-y-4">
        {value.wa && (
          <div className="flex items-center gap-3 p-3 border border-ink/5 bg-ink/[0.02]">
            <div className="w-6 h-6 bg-rose/10 border border-rose/20 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-semibold text-rose">WA</span>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-ink/30">WhatsApp</p>
              <p className="text-[11px] font-semibold text-ink">{value.wa}</p>
            </div>
          </div>
        )}
        {value.email && (
          <div className="flex items-center gap-3 p-3 border border-ink/5 bg-ink/[0.02]">
            <div className="w-6 h-6 bg-ink/5 border border-ink/10 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-semibold text-ink/40">@</span>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-ink/30">Email</p>
              <p className="text-[11px] font-semibold text-ink">{value.email}</p>
            </div>
          </div>
        )}
        {value.hours && (
          <div className="flex items-center gap-3 p-3 border border-ink/5 bg-ink/[0.02]">
            <div className="w-6 h-6 bg-ink/5 border border-ink/10 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-semibold text-ink/40">JH</span>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-ink/30">Jam Operasional</p>
              <p className="text-[11px] font-semibold text-ink">{value.hours}</p>
            </div>
          </div>
        )}
        {value.notes && (
          <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/50 font-medium border-t border-ink/5 pt-3">
            {value.notes}
          </p>
        )}
      </div>
    );
  }

  // Object with policy/process/notes (return & refund)
  if (typeof value === 'object' && (value.policy || value.process)) {
    return (
      <div className="space-y-4">
        {value.policy && (
          <div>
            <p className="text-[8px] uppercase tracking-widest font-semibold text-rose/50 mb-2">Kebijakan Retur</p>
            <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">{value.policy}</p>
          </div>
        )}
        {value.process && (
          <div className="border-t border-ink/5 pt-4">
            <p className="text-[8px] uppercase tracking-widest font-semibold text-rose/50 mb-2">Alur Proses Retur</p>
            <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">{value.process}</p>
          </div>
        )}
        {value.notes && (
          <div className="border-t border-ink/5 pt-4">
            <p className="text-[8px] uppercase tracking-widest font-semibold text-rose/50 mb-2">Catatan</p>
            <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">{value.notes}</p>
          </div>
        )}
      </div>
    );
  }

  // Plain string or plain object
  const str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">
      {str}
    </p>
  );
}

export default function HelpPage() {
  const [settings, setSettings] = useState<Record<string, SettingItem>>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('help_guide_customer_care');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/help');
        const json = await res.json();
        const data: SettingItem[] = json.data || [];
        const map: Record<string, SettingItem> = {};
        data.forEach(item => { map[item.key] = item; });
        setSettings(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Merge DB data with defaults — always show content
  const activeItem = useMemo(() => {
    const dbItem = settings[activeSection];
    if (dbItem) return dbItem;
    // Fallback to default values
    const defaultVal = DEFAULT_VALUES[activeSection];
    if (defaultVal) return { key: activeSection, value: defaultVal };
    return null;
  }, [settings, activeSection]);

  return (
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white">
      {/* Exit Navigation — static top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-ink/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors group"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:-translate-x-0.5">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium">Return to Archive Catalog</span>
          </Link>
          <span className="text-[7px] uppercase tracking-[0.15em] text-ink/20 font-medium">Help Guide</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 pb-20">
        {/* Title */}
        <div className="border-b border-ink/5 pb-4 mb-0">
          <div className="flex items-baseline gap-4">
            <h1 className="font-display font-medium italic text-2xl tracking-tighter uppercase text-ink">Help Guide</h1>
            <span className="text-[8px] uppercase tracking-widest text-ink/30 font-medium">ARCHIVAL CATALOG</span>
          </div>
          <p className="text-[9px] text-ink/30 mt-2 uppercase tracking-widest">Panduan customer care, pembayaran, pengiriman, dan ketentuan lainnya</p>
        </div>

        {/* Content Grid: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-0 mt-0">

          {/* Section Tabs — Sidebar */}
          <div className="lg:w-[180px] shrink-0 lg:border-r lg:border-ink/5 lg:pr-0 pr-0">
            <div className="flex lg:flex-col gap-0 overflow-x-auto lg:overflow-visible no-scrollbar lg:pt-6 pb-2 lg:pb-0">
              {HELP_SECTIONS.map((section) => {
                const item = settings[section.key];
                const hasContent = item && (item.value?.guide || item.value?.info || item.value?.policy || item.value);
                return (
                  <button
                    key={section.key}
                    onClick={() => { setActiveSection(section.key); setIsMobileOpen(false); }}
                    className={`
                      shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-ink/5 lg:border-b lg:border-r lg:border-l
                      transition-all text-left whitespace-nowrap
                      ${activeSection === section.key
                        ? 'bg-rose text-white border-rose lg:border-rose'
                        : 'text-ink/40 hover:text-ink hover:bg-ink/[0.02] border-transparent'
                      }
                    `}
                  >
                    <span className={`
                      text-[8px] font-semibold tabular-nums w-5 h-5 flex items-center justify-center rounded-sm
                      shrink-0
                      ${activeSection === section.key ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink/30'}
                    `}>
                      {section.icon}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 lg:pl-8 pt-6 lg:pt-6 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-5 h-5 border border-ink/10 border-t-rose rounded-full animate-spin" />
              </div>
            ) : activeItem ? (
              <div>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ink/5">
                  <div className="w-8 h-8 border border-ink/10 flex items-center justify-center bg-ink/[0.02]">
                    <span className="text-[9px] font-semibold uppercase">{activeItem.key.split('_').pop()?.slice(0, 3) || 'XX'}</span>
                  </div>
                  <div>
                    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink">
                      {HELP_SECTIONS.find(s => s.key === activeItem.key)?.label}
                    </h2>
                    <p className="text-[8px] text-ink/30 uppercase tracking-widest mt-0.5">
                      {activeItem.key.replace('help_guide_', '').toUpperCase()}
                    </p>
                  </div>
                </div>
                <SectionContent value={activeItem.value} sectionKey={activeItem.key} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-ink/20">
                <div className="w-8 h-8 border border-ink/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v6M7 10v1M2 7h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[9px] uppercase tracking-widest font-semibold">Content not available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-ink/5 px-6 py-4">
        <p className="text-[8px] text-ink/20 uppercase tracking-widest text-center">
          Informasi di halaman ini dikelola oleh Studio dan dapat diubah sewaktu-waktu
        </p>
      </div>
    </main>
  );
}