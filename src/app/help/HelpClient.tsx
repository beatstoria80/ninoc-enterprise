"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from '@/components/LocalizedLink';
import GlobalFooter from '@/components/Footer';

interface HelpSection {
  key: string;
  label: string;
  icon: React.ReactNode;
}

/* ── SVG Icons ── */
const IconHeadset = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);
const IconCreditCard = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IconRefresh = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconTruck = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconClipboard = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);
const IconMapPin = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconScroll = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);
const IconShield = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconWhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const HELP_SECTIONS: HelpSection[] = [
  { key: 'help_guide_customer_care', label: 'Customer Care', icon: <IconHeadset /> },
  { key: 'help_guide_payment', label: 'Payment', icon: <IconCreditCard /> },
  { key: 'help_guide_return', label: 'Return & Refund', icon: <IconRefresh /> },
  { key: 'help_guide_shipping', label: 'Shipping', icon: <IconTruck /> },
  { key: 'help_guide_how_to_order', label: 'How to Order', icon: <IconClipboard /> },
  { key: 'help_guide_how_to_track', label: 'Tracking', icon: <IconMapPin /> },
  { key: 'help_guide_terms', label: 'Terms', icon: <IconScroll /> },
  { key: 'help_guide_privacy', label: 'Privacy', icon: <IconShield /> },
];

const DEFAULT_VALUES: Record<string, any> = {
  help_guide_customer_care: {
    wa: '08211983774',
    email: 'cs@ninoc.store',
    hours: 'Senin–Sabtu, 08.00–17.00 WIB',
    notes: 'Untuk pertanyaan mengenai pembayaran, retur, atau refund, silakan buat tiket bantuan melalui fitur Support Chat di pojok kanan bawah.',
  },
  help_guide_payment: {
    guide: 'Kami menyediakan berbagai metode pembayaran yang aman dan mudah untuk kenyamanan Anda.\n\nMetode Pembayaran yang Tersedia:\n\n• Transfer Bank (BCA, Mandiri, BRI, BNI)\n• Virtual Account\n• QRIS\n• Kartu Debit/Kredit (jika tersedia)\n\nProses Pembayaran:\n\n1. Pilih produk yang ingin dibeli.\n2. Lanjutkan ke halaman checkout.\n3. Pilih metode pembayaran yang diinginkan.\n4. Ikuti instruksi pembayaran.\n5. Setelah pembayaran berhasil, pesanan akan otomatis diproses.',
    accounts: [],
  },
  help_guide_return: {
    policy: 'Kepuasan pelanggan adalah prioritas kami. Jika produk yang Anda terima tidak sesuai, rusak, atau terdapat kesalahan pengiriman, Anda dapat mengajukan retur atau refund sesuai ketentuan berikut.\n\nSyarat Pengajuan:\n\n• Produk diterima dalam kondisi rusak atau cacat.\n• Produk yang dikirim tidak sesuai dengan pesanan.\n• Pengajuan dilakukan maksimal 2 x 24 jam setelah barang diterima.\n• Produk belum digunakan dan masih dalam kondisi lengkap.\n• Bukti unboxing video WAJIB — 1-shot tanpa edit, potong, atau henti.\n• Label& tag masih menempel.\n• Timestamp/waktu terlihat jelas di rekaman.\n\n• Kebijakan Retur & Refund Lengkap: /refund-policy',
    process: '1. Buka fitur Support Chat di pojok kanan bawah layar.\n2. Buat tiket baru dengan memilih topik "Retur & Refund".\n3. Sertakan nomor pesanan, foto produk, deskripsi kendala, dan bukti video unboxing (1-shot).\n4. Tim kami akan melakukan verifikasi dalam 1–2 hari kerja.\n5. Refund diproses 3–7 hari kerja setelah persetujuan.\n\nPanduan Video Unboxing:\n\n• Rekam saat membuka paket dari keadaan tertutup.\n• Tunjukkan kondisi barang dengan jelas.\n• WAJIB 1-shot — tanpa edit, potong, henti, atau sisipkan adegan.\n• Timestamp/waktu harus terlihat jelas.\n• Minimal durasi 30 detik.',
    notes: '• Bukti video 1-shot tanpa edit adalah WAJIB — tanpa video, pengajuan tidak dapat diproses.\n• Refund dikembalikan melalui metode pembayaran awal atau transfer bank.\n• Biaya pengiriman retur ditanggung sesuai hasil verifikasi.\n• NINOC berhak menolak pengajuan yang tidak memenuhi syarat.\n• Pengajuan bisa dilakukan tanpa login — cukup siapkan Order ID dan email aktif.',
  },
  help_guide_shipping: {
    info: 'Terima kasih telah berbelanja di toko kami.\n\nKami memproses pesanan setiap hari kerja (Senin–Sabtu) pukul 08.00–17.00 WIB.\n\nEstimasi Pengiriman:\n\nJabodetabek: 1–2 hari kerja\nPulau Jawa: 2–4 hari kerja\nLuar Pulau Jawa: 3–7 hari kerja\n\nKetentuan Pengiriman:\n\n• Pesanan yang masuk sebelum pukul 15.00 WIB akan diproses di hari yang sama.\n• Nomor resi akan dikirim otomatis setelah pesanan dikirim.\n\n• Kebijakan Pengiriman Lengkap: /shipping-policy',
    area: 'Kami mengirim ke seluruh Indonesia',
  },
  help_guide_how_to_order: 'Ikuti langkah mudah berikut untuk melakukan pemesanan:\n1. Pilih produk yang ingin Anda beli.\n2. Klik tombol Tambah ke Keranjang atau Beli Sekarang.\n3. Masukkan jumlah produk yang diinginkan.\n4. Isi data pengiriman dengan lengkap.\n5. Pilih metode pembayaran yang tersedia.\n6. Klik Buat Pesanan.\n7. Lakukan pembayaran sesuai instruksi.\n8. Pesanan Anda akan segera kami proses setelah pembayaran terverifikasi.\n\nCatatan:\n\n• Pastikan alamat dan nomor WhatsApp yang Anda masukkan sudah benar.\n• Simpan nomor pesanan untuk memudahkan pengecekan status.',
  help_guide_how_to_track: 'Setelah pesanan Anda dikirim, kami akan memberikan nomor resi pengiriman melalui WhatsApp atau email yang terdaftar.\n\nCara Melacak Pesanan:\n\n1. Salin nomor resi yang telah kami kirimkan.\n2. Kunjungi website resmi jasa pengiriman yang digunakan.\n3. Masukkan nomor resi pada kolom pelacakan.\n4. Klik tombol Lacak.\n5. Informasi status pengiriman akan ditampilkan oleh pihak ekspedisi.',
  help_guide_terms: 'Dengan mengakses dan bertransaksi di toko kami, Anda dianggap telah membaca, memahami, dan menyetujui syarat dan ketentuan berikut:\n\nKetentuan Umum\n\n• Seluruh harga produk ditampilkan dalam Rupiah (IDR).\n• Stok dan harga produk dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.\n• Pesanan akan diproses setelah pembayaran berhasil diterima dan diverifikasi.\n• Pembeli wajib memastikan data pemesanan dan alamat pengiriman sudah benar.',
  help_guide_privacy: 'Kami menghargai kepercayaan Anda dan berkomitmen untuk menjaga keamanan serta kerahasiaan setiap data pribadi yang diberikan saat menggunakan layanan dan melakukan transaksi di toko kami.\n\nInformasi yang kami kumpulkan digunakan secara terbatas untuk keperluan:\n\n• Pemrosesan dan konfirmasi pesanan\n• Pengiriman produk\n• Verifikasi pembayaran\n• Layanan pelanggan dan penanganan keluhan',
};

interface SettingItem {
  key: string;
  value: any;
}

function SplitText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  if (paragraphs.length <= 1) {
    return (
      <div className="text-[13px] leading-[1.9] whitespace-pre-line text-ink font-medium">
        {text}
      </div>
    );
  }
  const mid = Math.ceil(paragraphs.length / 2);
  const col1 = paragraphs.slice(0, mid).join('\n\n');
  const col2 = paragraphs.slice(mid).join('\n\n');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 text-[13px] leading-[1.9] text-ink font-medium">
      <div className="whitespace-pre-line">{col1}</div>
      <div className="whitespace-pre-line">{col2}</div>
    </div>
  );
}

function SectionContent({ value }: { value: any }) {
  if (!value) return null;

  if (typeof value === 'object' && (value.wa || value.email || value.hours)) {
    return (
      <div className="space-y-3">
        {value.wa && (
          <div className="flex items-center gap-3 p-3 border border-ink/8">
            <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <IconWhatsApp />
            </div>
            <div>
              <p className="text-xs md:text-[9px] uppercase tracking-[0.2em] text-ink/50 font-medium">WhatsApp</p>
              <p className="text-[13px] font-medium text-ink mt-0.5">{value.wa}</p>
            </div>
          </div>
        )}
        {value.email && (
          <div className="flex items-center gap-3 p-3 border border-ink/8">
            <div className="w-8 h-8 bg-ink/[0.03] border border-ink/8 flex items-center justify-center shrink-0">
              <IconEmail />
            </div>
            <div>
              <p className="text-xs md:text-[9px] uppercase tracking-[0.2em] text-ink/50 font-medium">Email</p>
              <p className="text-[13px] font-medium text-ink mt-0.5">{value.email}</p>
            </div>
          </div>
        )}
        {value.hours && (
          <div className="flex items-center gap-3 p-3 border border-ink/8">
            <div className="w-8 h-8 bg-ink/[0.03] border border-ink/8 flex items-center justify-center shrink-0">
              <IconClock />
            </div>
            <div>
              <p className="text-xs md:text-[9px] uppercase tracking-[0.2em] text-ink/50 font-medium">Jam Operasional</p>
              <p className="text-[13px] font-medium text-ink mt-0.5">{value.hours}</p>
            </div>
          </div>
        )}
        {value.notes && (
          <p className="text-[13px] leading-[1.8] text-ink font-medium pt-2 border-t border-ink/5">{value.notes}</p>
        )}
      </div>
    );
  }

  if (typeof value === 'object' && value.guide) {
    return (
      <div className="space-y-3">
        <SplitText text={value.guide} />
        {value.accounts?.length > 0 && (
          <div className="pt-3 border-t border-ink/5">
            <p className="text-xs md:text-[10px] uppercase tracking-[0.2em] font-medium text-ink/50 mb-2">Rekening Tujuan</p>
            <div className="space-y-1.5">
              {value.accounts.map((acc: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 border border-ink/8 bg-ink/[0.015]">
                  <span className="text-xs md:text-[10px] font-medium text-rose mt-0.5 w-4 text-center">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[13px] font-medium text-ink">{acc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (typeof value === 'object' && value.info) {
    return (
      <div className="space-y-3">
        <SplitText text={value.info} />
        {value.area && (
          <p className="text-xs md:text-[10px] uppercase tracking-[0.2em] font-medium text-rose pt-3 border-t border-ink/5">{value.area}</p>
        )}
      </div>
    );
  }

  if (typeof value === 'object' && (value.policy || value.process || value.notes)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {value.policy && (
          <div className="border border-ink/8 p-4">
            <p className="text-xs md:text-[10px] uppercase tracking-[0.2em] font-medium text-rose mb-2">Kebijakan Retur</p>
            <p className="text-[13px] leading-[1.8] whitespace-pre-line text-ink font-medium">{value.policy}</p>
          </div>
        )}
        {value.process && (
          <div className="border border-ink/8 p-4">
            <p className="text-xs md:text-[10px] uppercase tracking-[0.2em] font-medium text-ink/50 mb-2">Alur Proses</p>
            <p className="text-[13px] leading-[1.8] whitespace-pre-line text-ink font-medium">{value.process}</p>
          </div>
        )}
        {value.notes && (
          <div className="border border-ink/8 p-4">
            <p className="text-xs md:text-[10px] uppercase tracking-[0.2em] font-medium text-ink/50 mb-2">Catatan</p>
            <p className="text-[13px] leading-[1.8] whitespace-pre-line text-ink font-medium">{value.notes}</p>
          </div>
        )}
      </div>
    );
  }

  const str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return <SplitText text={str} />;
}

export default function HelpClient({ initialSettings = [] }: { initialSettings?: SettingItem[] }) {
  const [settings] = useState<Record<string, SettingItem>>(() => {
    const map: Record<string, SettingItem> = {};
    initialSettings.forEach((item) => { map[item.key] = item; });
    return map;
  });
  const [activeSection, setActiveSection] = useState('help_guide_customer_care');

  const activeItem = useMemo(() => {
    const dbItem = settings[activeSection];
    if (dbItem) return dbItem;
    const defaultVal = DEFAULT_VALUES[activeSection];
    if (defaultVal) return { key: activeSection, value: defaultVal };
    return null;
  }, [settings, activeSection]);

  const activeMeta = HELP_SECTIONS.find((s) => s.key === activeSection);

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink font-medium selection:bg-ink selection:text-white">
      {/* Exit Navigation */}
      <div className="shrink-0 bg-white border-b border-ink/5 z-50">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 flex items-center justify-between h-11">
          <Link href="/" className="flex items-center gap-2.5 text-ink/60 hover:text-ink transition-colors group">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:-translate-x-0.5">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] md:text-[8px] uppercase tracking-[0.2em] font-medium">Return to Archive Catalog</span>
          </Link>
          <span className="text-[10px] md:text-[7px] uppercase tracking-[0.15em] text-ink/20 font-medium hidden sm:block">Help Guide</span>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 h-full flex flex-col">
          <div className="shrink-0 pt-[120px] pb-2">
            <div className="flex items-baseline gap-4">
              <h1 className="font-display font-medium italic text-xl tracking-tighter uppercase text-ink">Help Guide</h1>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-0 border-t border-ink/5">
            <div className="lg:border-r lg:border-ink/5 overflow-x-auto lg:overflow-x-hidden overflow-y-hidden lg:overflow-y-auto border-b lg:border-b-0 border-ink/5 no-scrollbar">
              <nav className="flex lg:flex-col gap-0 min-w-max lg:min-w-0">
                {HELP_SECTIONS.map((section) => {
                  const isActive = activeSection === section.key;
                  return (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-3 lg:px-3 lg:py-2 border-b-2 lg:border-b lg:border-r lg:border-l lg:border-t transition-all text-left ${isActive ? 'bg-rose/5 lg:bg-rose text-rose lg:text-white border-b-rose lg:border-rose' : 'text-ink/60 hover:text-ink hover:bg-ink/[0.02] border-b-transparent lg:border-transparent'}`}
                    >
                      <span className={`w-6 h-6 rounded-sm flex items-center justify-center shrink-0 ${isActive ? 'bg-rose/20 lg:bg-white/20 text-rose lg:text-white' : 'bg-ink/[0.04] text-ink/50'}`}>
                        {section.icon}
                      </span>
                      <span className="text-xs md:text-[10px] font-medium uppercase tracking-[0.08em]">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="lg:pl-6 pt-4 lg:pt-3 min-w-0 overflow-y-auto pb-6">
              {activeItem ? (
                <>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-ink/5">
                    <div className="w-7 h-7 border border-ink/8 flex items-center justify-center bg-ink/[0.015] shrink-0">
                      <span className="text-ink/50">{activeMeta?.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[13px] font-medium uppercase tracking-[0.15em] text-ink">{activeMeta?.label}</h2>
                      <p className="text-xs md:text-[9px] text-ink/50 uppercase tracking-[0.2em]">
                        {activeItem.key.replace('help_guide_', '').replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                    {activeSection === 'help_guide_return' && (
                      <Link href="/retur" className="shrink-0 px-3 py-1.5 bg-rose text-white text-[11px] md:text-[8px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose/90 transition-colors">
                        Ajukan Retur
                      </Link>
                    )}
                  </div>
                  <SectionContent value={activeItem.value} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-ink/20">
                  <div className="w-8 h-8 border border-ink/8 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v6M7 10v1M2 7h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-xs md:text-[9px] uppercase tracking-[0.2em] font-medium">Content not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="shrink-0">
        <GlobalFooter />
      </div>
    </div>
  );
}
