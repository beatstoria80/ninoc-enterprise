"use client";

import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import GlobalFooter from '@/components/Footer';

export default function LegalClient() {
  const pathname = usePathname();
  const router = useRouter();
  const lang: 'ID' | 'EN' = pathname?.startsWith('/en') ? 'EN' : 'ID';

  const handleLangChange = (newLang: 'ID' | 'EN') => {
    if (newLang === lang) return;
    // Optional: push to the correct URL for SEO
    if (newLang === 'EN' && !pathname?.startsWith('/en')) {
      router.push(`/en${pathname === '/' ? '' : pathname}`);
    } else if (newLang === 'ID' && pathname?.startsWith('/en')) {
      router.push(pathname.replace('/en', '') || '/');
    }
  };

  const content = {
    EN: {
      title: "LEGAL & COMPLIANCE",
      updated: "VER 3.0 / JUNE 2026",
      terms: {
        title: "TERMS & CONDITIONS",
        sections: [
          { id: "01", title: "Acceptance of Terms", text: "By accessing and purchasing from NINOC ATELIER, you legally agree to be bound by these Terms of Service. These terms apply to all users of the site, including browsers, vendors, and customers. If you do not agree, you are strictly prohibited from using our services." },
          { id: "02", title: "Accuracy & Modifications", text: "We reserve the right to modify prices, product availability, and specifications at any time without prior notice. We shall not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Service." },
          { id: "03", title: "Shipping & Liability", text: "All purchases are made pursuant to a shipment contract (FOB Shipping Point). The risk of loss and title for such items pass to you upon our delivery to the shipping carrier. We are not liable for delays caused by customs or carrier mishandling." },
          { id: "04", title: "Strict Return Policy", text: "Returns are ONLY accepted within 48 hours (2x24 hours) of delivery confirmation. Claims MUST be accompanied by an uncut, unedited continuous UNBOXING VIDEO. Products must be unworn, unwashed, with all original tags attached. Without the unboxing video, any claim for defect or shortage will be automatically rejected." },
          { id: "05", title: "Intellectual Property", text: "All content included on this site (designs, logos, images, text, and graphics) is the exclusive property of NINOC and protected by International Copyright Laws. Unauthorized reproduction or commercial use is strictly prohibited and subject to legal prosecution." },
          { id: "06", title: "Limitation of Liability", text: "In no case shall NINOC, our directors, or employees be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, or consequential damages of any kind arising from your use of our service or products." },
          { id: "07", title: "Governing Law", text: "These Terms of Service and any separate agreements shall be governed by and construed in accordance with the laws of the Republic of Indonesia." }
        ]
      },
      privacy: {
        title: "PRIVACY POLICY",
        sections: [
          { id: "01", title: "Data Collection", text: "We collect personal data (Name, Address, Email, Phone Number) strictly for the purpose of order fulfillment and communication. By providing this information, you consent to our collection according to applicable Data Protection Laws." },
          { id: "02", title: "Data Usage & Sharing", text: "Your data is strictly confidential. We only share necessary information with trusted third parties (Logistics Partners and Payment Gateways like Midtrans) purely to process your transactions and deliveries. We do NOT sell or rent your data to marketing agencies." },
          { id: "03", title: "Security & Encryption", text: "Our store is hosted on secure servers. All credit card transactions are encrypted through the Payment Card Industry Data Security Standard (PCI-DSS). We do not store your sensitive financial information on our servers." },
          { id: "04", title: "User Rights", text: "You have the right to request access, correction, or deletion of your personal data stored in our system at any time by contacting our legal department." }
        ]
      }
    },
    ID: {
      title: "LEGAL & KEPATUHAN",
      updated: "VER 3.0 / JUNI 2026",
      terms: {
        title: "SYARAT & KETENTUAN",
        sections: [
          { id: "01", title: "Persetujuan Hukum", text: "Dengan mengakses dan bertransaksi di NINOC ATELIER, Anda secara sah terikat dengan Syarat dan Ketentuan ini. Ketentuan ini berlaku untuk seluruh pengguna situs. Jika Anda tidak setuju dengan ketentuan hukum ini, Anda dilarang keras untuk menggunakan layanan kami." },
          { id: "02", title: "Akurasi & Perubahan", text: "NINOC memegang hak prerogatif penuh untuk mengubah harga, ketersediaan produk, dan spesifikasi kapan saja tanpa pemberitahuan sebelumnya. Kami tidak bertanggung jawab kepada pihak mana pun atas kerugian akibat perubahan harga atau penangguhan layanan." },
          { id: "03", title: "Pengiriman & Tanggung Jawab", text: "Pengiriman barang mengacu pada kontrak pengiriman (FOB Shipping Point). Segala risiko kehilangan dan kerusakan berpindah menjadi tanggung jawab Anda sepenuhnya terhitung sejak paket kami serahkan ke pihak ekspedisi (kurir). Kami tidak bertanggung jawab atas keterlambatan atau kelalaian pihak ketiga." },
          { id: "04", title: "Kebijakan Retur Ketat", text: "Klaim pengembalian (retur) HANYA dilayani maksimal 2x24 jam sejak resi dinyatakan 'Diterima'. Klaim WAJIB menyertakan VIDEO UNBOXING secara utuh tanpa jeda (cut) atau editan sejak paket masih tersegel. Produk harus dalam kondisi baru (belum dipakai/dicuci) dan tag masih terpasang. Tanpa Video Unboxing, segala bentuk klaim cacat atau kekurangan barang akan ditolak mutlak." },
          { id: "05", title: "Hak Kekayaan Intelektual", text: "Seluruh konten dalam situs ini (desain pakaian, logo, foto kampanye, tipografi) adalah milik eksklusif NINOC dan dilindungi oleh UU No. 28 Tahun 2014 tentang Hak Cipta & UU Merek. Penggandaan, pembajakan desain, atau penggunaan komersial tanpa izin akan dituntut secara perdata maupun pidana." },
          { id: "06", title: "Batasan Tanggung Jawab", text: "Sesuai Undang-Undang Perlindungan Konsumen, tanggung jawab maksimal NINOC atas segala bentuk keluhan, kerugian, atau klaim ganti rugi yang terbukti sah, tidak akan melebihi total nominal transaksi (harga barang) yang telah Anda bayarkan kepada kami." },
          { id: "07", title: "Hukum yang Berlaku", text: "Syarat dan Ketentuan ini diatur, ditafsirkan, dan tunduk pada hukum Negara Kesatuan Republik Indonesia. Segala sengketa akan diselesaikan melalui musyawarah atau yurisdiksi Pengadilan Negeri di wilayah NINOC beroperasi." }
        ]
      },
      privacy: {
        title: "KEBIJAKAN PRIVASI",
        sections: [
          { id: "01", title: "Pengumpulan Data", text: "Sesuai dengan UU Pelindungan Data Pribadi (UU PDP), kami mengumpulkan identitas pribadi (Nama, Alamat Pengiriman, Email, Nomor Telepon) murni untuk keperluan pemrosesan pesanan, logistik, dan verifikasi akun konsumen." },
          { id: "02", title: "Penggunaan & Distribusi", text: "Data Anda dijamin kerahasiaannya. Kami hanya membagikan data yang diperlukan kepada pihak ketiga resmi (Mitra Ekspedisi dan Gateway Pembayaran Midtrans) semata-mata untuk memproses pesanan Anda. Kami TIDAK PERNAH memperjualbelikan data pelanggan kepada pihak manapun." },
          { id: "03", title: "Keamanan Transaksi", text: "Transaksi finansial Anda dilindungi oleh enkripsi standar perbankan industri (PCI-DSS) melalui penyelenggara sistem elektronik tersertifikasi. NINOC tidak pernah menyimpan nomor kartu kredit atau sandi perbankan Anda di server kami." },
          { id: "04", title: "Hak Pengguna Data", text: "Anda berhak untuk meminta akses, melakukan perbaikan (koreksi), atau meminta penghapusan permanen atas data diri Anda dari sistem kami kapan saja dengan menghubungi layanan pelanggan/departemen legal kami." }
        ]
      }
    }
  };

  const t = content[lang];

  return (
    <main className="h-screen bg-cr noise overflow-hidden flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-[200] px-6 md:px-12 py-4 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/" className="flex items-center gap-3 text-ink/40 hover:text-rose transition-all group">
          <ArrowLeft size={12} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/20">Studio Exit</span>
            <span className="text-[9px] font-medium uppercase tracking-widest text-ink">Back to Atelier</span>
          </div>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[9px] font-display font-medium italic tracking-tighter text-rose uppercase">NINOC</span>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-medium tracking-widest border border-ink/5 rounded-full px-3 py-1.5 bg-white/50 shadow-sm">
          <button onClick={() => handleLangChange('ID')} className={`transition-all ${lang === 'ID' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}>ID</button>
          <span className="text-ink/5">|</span>
          <button onClick={() => handleLangChange('EN')} className={`transition-all ${lang === 'EN' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}>EN</button>
        </div>
      </nav>

      <div className="flex-1 min-h-0 pt-16 md:pt-20 pb-4 px-6 md:px-12 flex flex-col max-w-[1800px] mx-auto w-full">

        <div className="flex items-baseline justify-between mb-4 border-b border-ink/5 pb-2">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl md:text-2xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none">{t.title}</h1>
            <span className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/60">{t.updated}</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-emerald-500" />
             <span className="text-[7px] font-medium uppercase tracking-widest text-emerald-600/50">Studio Live</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 pt-4 pb-20 md:pb-0 overflow-y-auto pr-2 scrollbar-hide">

          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-ink/10 pb-1 sticky top-0 bg-cr/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                   <h2 className="text-[12px] font-display font-medium italic text-ink uppercase tracking-[0.3em]">{t.terms.title}</h2>
                </div>
                <span className="text-[7px] font-medium text-ink/20 uppercase tracking-[0.4em]">Section 01</span>
             </div>

             <div className="space-y-5 pb-6">
                {t.terms.sections.map((s) => (
                  <div key={s.id} className="space-y-1 group">
                     <div className="flex items-center gap-4">
                        <span className="text-[8px] font-medium text-rose/40 tabular-nums">{s.id}</span>
                        <h3 className="text-[10px] font-medium text-ink uppercase tracking-widest">{s.title}</h3>
                     </div>
                     <p className="text-[10px] font-medium leading-relaxed text-ink/60 uppercase tracking-wide pl-8">
                        {s.text}
                     </p>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-ink/10 pb-1 sticky top-0 bg-cr/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                   <h2 className="text-[12px] font-display font-medium italic text-ink uppercase tracking-[0.3em]">{t.privacy.title}</h2>
                </div>
                <span className="text-[7px] font-medium text-ink/20 uppercase tracking-[0.4em]">Section 02</span>
             </div>

             <div className="space-y-5 pb-6">
                {t.privacy.sections.map((s) => (
                  <div key={s.id} className="space-y-1 group">
                     <div className="flex items-center gap-4">
                        <span className="text-[8px] font-medium text-rose/40 tabular-nums">{s.id}</span>
                        <h3 className="text-[10px] font-medium text-ink uppercase tracking-widest">{s.title}</h3>
                     </div>
                     <p className="text-[10px] font-medium leading-relaxed text-ink/60 uppercase tracking-wide pl-8">
                        {s.text}
                     </p>
                  </div>
                ))}
             </div>

             <div className="pt-6 border-t border-ink/5 space-y-2 pb-12">
                <div className="flex items-center gap-3">
                   <Shield size={10} className="text-rose/40" />
                   <span className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/30">Security Protocol / UU No. 8 Tahun 1999</span>
                </div>
                <p className="text-[8px] text-ink/20 uppercase tracking-[0.1em] leading-tight max-w-sm">
                   THIS DOCUMENT IS LEGALLY BINDING. PROTECTING BRAND INTEGRITY AND CONSUMER RIGHTS IN ACCORDANCE WITH THE LAWS OF THE REPUBLIC OF INDONESIA.
                </p>
             </div>
          </div>

        </div>
      </div>

      <GlobalFooter />
    </main>
  );
}
