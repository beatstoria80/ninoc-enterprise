"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Share2, ArrowRight, FileText, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

const DICT = {
  ID: {
    title: "Become an Affiliate.",
    desc: "Ubah pengaruh Anda menjadi pendapatan pasif berkelanjutan. Ekosistem NINOC memberikan komisi eksklusif bagi mitra yang berhasil mereferensikan transaksi sukses.",
    pillars: "Pilar Afiliasi",
    p1_title: "Komisi Transparan",
    p1_desc: "Dapatkan persentase tetap untuk setiap penjualan valid melalui tautan referral Anda.",
    p2_title: "Akses Eksklusif",
    p2_desc: "Jadilah yang pertama tahu rilis koleksi baru dan dapatkan sampel produk gratis (S&K berlaku).",
    p3_title: "Dashboard Real-Time",
    p3_desc: "Lacak klik, konversi, dan komisi Anda secara real-time dari satu dasbor.",
    form_title: "Formulir Aplikasi Afiliasi",
    step1: "1. Data Pribadi",
    full_name: "Nama Lengkap",
    email: "Email Utama",
    phone: "Nomor WhatsApp",
    step2: "2. Informasi Platform",
    channel_name: "Nama Channel/Akun Utama",
    ig_url: "URL Profil Instagram",
    tiktok_url: "URL Profil TikTok",
    yt_url: "URL Channel YouTube",
    fb_url: "URL Halaman/Profil Facebook",
    address: "Alamat Pengiriman (Untuk Sampel)",
    npwp: "NPWP Pribadi (Opsional)",
    step3: "3. Dokumen Verifikasi",
    kyc_desc: "Diperlukan untuk validasi identitas dan audiens. (Kurasi oleh tim NINOC)",
    ktp_label: "KTP Identitas Asli",
    ig_insight_label: "Screenshot Insight Instagram",
    tiktok_insight_label: "Screenshot Insight TikTok",
    yt_insight_label: "Screenshot Insight YouTube",
    fb_insight_label: "Screenshot Insight Facebook",
    uploading: "Mengunggah...",
    uploaded: "File tersimpan.",
    upload_hint: "PDF/JPG (Max 5MB)",
    btn_upload: "Upload",
    terms_title: "Syarat & Ketentuan Afiliasi",
    t1: "1. KOMISI: Afiliator akan menerima komisi yang disepakati untuk setiap penjualan yang selesai menggunakan tautan/kode rujukan.",
    t2: "2. KONTEN: Afiliator dilarang menggunakan materi promosi yang menyesatkan atau merusak reputasi NINOC.",
    t3: "3. PENCAIRAN: Komisi dapat dicairkan setelah mencapai batas minimum dan melewati masa garansi pengembalian produk (7 hari).",
    agree: "Saya setuju dengan Syarat Layanan Afiliasi dan Kebijakan Privasi NINOC.",
    submit: "Kirim Aplikasi",
    submitting: "Mengirim...",
    success: "Aplikasi Diterima!",
    success_desc: "Aplikasi afiliasi Anda sedang kami tinjau. Tim kami akan menghubungi Anda melalui email dalam waktu 1-3 hari kerja.",
    return_home: "Kembali ke Beranda"
  },
  EN: {
    title: "Become an Affiliate.",
    desc: "Turn your influence into sustainable passive income. The NINOC ecosystem provides exclusive commissions for partners who drive successful transactions.",
    pillars: "Affiliate Pillars",
    p1_title: "Transparent Commissions",
    p1_desc: "Earn a fixed percentage on every valid sale made through your unique referral link.",
    p2_title: "Exclusive Access",
    p2_desc: "Be the first to know about new collection drops and get free product samples (T&C apply).",
    p3_title: "Real-Time Dashboard",
    p3_desc: "Track your clicks, conversions, and commissions in real-time from a single dashboard.",
    form_title: "Affiliate Application Form",
    step1: "1. Personal Data",
    full_name: "Full Name",
    email: "Primary Email",
    phone: "WhatsApp Number",
    step2: "2. Platform Info",
    channel_name: "Main Channel/Account Name",
    ig_url: "Instagram Profile URL",
    tiktok_url: "TikTok Profile URL",
    yt_url: "YouTube Channel URL",
    fb_url: "Facebook Page/Profile URL",
    address: "Shipping Address (For Samples)",
    npwp: "Tax ID (Optional)",
    step3: "3. Verification Docs",
    kyc_desc: "Required for identity and audience validation. (Curated by NINOC team)",
    ktp_label: "Owner's ID (KTP)",
    ig_insight_label: "Instagram Insights Screenshot",
    tiktok_insight_label: "TikTok Insights Screenshot",
    yt_insight_label: "YouTube Insights Screenshot",
    fb_insight_label: "Facebook Insights Screenshot",
    uploading: "Uploading...",
    uploaded: "File stored.",
    upload_hint: "PDF/JPG (Max 5MB)",
    btn_upload: "Upload",
    terms_title: "Affiliate Terms & Conditions",
    t1: "1. COMMISSION: Affiliates earn an agreed percentage for every completed sale using their referral link/code.",
    t2: "2. CONTENT: Affiliates must not use misleading promotional materials or damage NINOC's reputation.",
    t3: "3. PAYOUTS: Commissions can be withdrawn after reaching the minimum threshold and clearing the product return window (7 days).",
    agree: "I agree to the NINOC Affiliate Terms of Service and Privacy Policy.",
    submit: "Submit Application",
    submitting: "Submitting...",
    success: "Application Received!",
    success_desc: "Your affiliate application is under review. Our team will contact you via email within 1-3 business days.",
    return_home: "Return to Home"
  }
};

const FileUploader = ({ 
  label, 
  type, 
  path,
  uploading,
  onUpload,
  dict
}: { 
  label: string; 
  type: string; 
  path: boolean;
  uploading: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  dict: any;
}) => (
  <div className="border border-dashed border-ink/20 p-4 rounded bg-white/50 group hover:border-rose/50 transition-colors">
    <label className="flex items-center justify-between cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded flex items-center justify-center ${path ? 'bg-emerald-50 text-emerald-600' : 'bg-ink/5 text-ink/40'}`}>
          {path ? <CheckCircle size={18} /> : <FileText size={18} />}
        </div>
        <div>
          <p className="text-[11px] font-bold text-ink uppercase tracking-wider">{label}</p>
          <p className="text-[10px] text-ink/50 mt-0.5">
            {uploading === type ? dict.uploading : path ? dict.uploaded : dict.upload_hint}
          </p>
        </div>
      </div>
      {!path && uploading !== type && (
        <div className="text-[10px] uppercase font-medium bg-ink/5 px-3 py-1.5 rounded text-ink/60 group-hover:bg-rose group-hover:text-white transition-colors">
          {dict.btn_upload}
        </div>
      )}
      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onUpload(e, type)} disabled={uploading === type} />
    </label>
  </div>
);

export default function AffiliateApplicationPage() {
  const pathname = usePathname();
  const lang = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = DICT[lang];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    channelName: '',
    instagramLink: '',
    tiktokLink: '',
    youtubeLink: '',
    facebookLink: '',
    address: '',
    npwp: ''
  });

  // Mock document states for visual completeness
  const [ktpUploaded, setKtpUploaded] = useState(false);
  const [igInsightUploaded, setIgInsightUploaded] = useState(false);
  const [tiktokInsightUploaded, setTiktokInsightUploaded] = useState(false);
  const [ytInsightUploaded, setYInsightUploaded] = useState(false);
  const [fbInsightUploaded, setFbInsightUploaded] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    // Simulate upload delay
    setTimeout(() => {
      if (type === 'ktp') setKtpUploaded(true);
      if (type === 'ig_insight') setIgInsightUploaded(true);
      if (type === 'tiktok_insight') setTiktokInsightUploaded(true);
      if (type === 'yt_insight') setYInsightUploaded(true);
      if (type === 'fb_insight') setFbInsightUploaded(true);
      setUploading(null);
    }, 1000);
  };

  const isFormValid = () => {
    if (!ktpUploaded) return false;
    if (formData.instagramLink && !igInsightUploaded) return false;
    if (formData.tiktokLink && !tiktokInsightUploaded) return false;
    if (formData.youtubeLink && !ytInsightUploaded) return false;
    if (formData.facebookLink && !fbInsightUploaded) return false;
    // Require at least one platform link
    if (!formData.instagramLink && !formData.tiktokLink && !formData.youtubeLink && !formData.facebookLink) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError("Please provide URLs for your platforms and upload their respective insight screenshots. KTP is also required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error: dbError } = await supabase
        .from('affiliate_applications')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          channel_name: formData.channelName,
          instagram_link: formData.instagramLink,
          tiktok_link: formData.tiktokLink,
          youtube_link: formData.youtubeLink,
          facebook_link: formData.facebookLink,
          address: formData.address,
          npwp: formData.npwp || null,
          status: 'pending'
        }]);

      if (dbError) throw dbError;
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cr noise flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-ink/5 p-8 text-center"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-display font-medium text-ink mb-3">{dict.success}</h2>
          <p className="text-sm text-ink/60 mb-8 leading-relaxed">
            {dict.success_desc}
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-4 bg-ink text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-rose transition-colors"
          >
            {dict.return_home}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-cr noise flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      <div className="w-[96vw] max-w-[1800px] h-[92vh] max-h-[1000px] flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 bg-white shadow-2xl border border-ink/5 rounded-xl overflow-hidden z-10">
        
        {/* Grid 1 - Info */}
        <div className="lg:col-span-3 flex flex-col justify-center space-y-6 bg-cr noise p-8 md:p-12 border-r border-ink/5 h-full relative">
          <div className="w-12 h-12 bg-ink text-white flex items-center justify-center rounded-none mb-4 shadow-xl relative z-10 shrink-0">
            <UserCheck size={24} />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display italic font-medium tracking-tight text-ink relative z-10 leading-none shrink-0">
            {dict.title}
          </h1>
          <p className="text-sm text-ink/70 leading-relaxed max-w-sm relative z-10 shrink-0">
            {dict.desc}
          </p>
          
          <div className="pt-6 border-t border-ink/10 space-y-4 relative z-10 flex-1 overflow-y-auto no-scrollbar">
            <h3 className="text-[10px] uppercase font-medium tracking-[0.2em] text-ink/50">{dict.pillars}</h3>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">{dict.p1_title}</p>
                <p className="text-[10px] text-ink/60 max-w-[250px]">{dict.p1_desc}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">{dict.p2_title}</p>
                <p className="text-[10px] text-ink/60 max-w-[250px]">{dict.p2_desc}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">{dict.p3_title}</p>
                <p className="text-[10px] text-ink/60 max-w-[250px]">{dict.p3_desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid 2 & 3 - Form */}
        <div className="lg:col-span-9 p-8 md:p-12 relative flex flex-col h-full bg-white overflow-hidden">
          <h2 className="text-xl font-display font-medium text-ink mb-6 shrink-0">{dict.form_title}</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex gap-2 items-start shrink-0">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 min-h-0">
            {/* Grid 2: Data Perusahaan -> Personal & Platform Info */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto no-scrollbar pr-4 pb-8 px-1 -mx-1">
              
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-ink/10 pb-2 sticky top-0 bg-white z-10 pt-1">{dict.step1}</h3>
              
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.full_name}</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="John Doe" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.email}</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.phone}</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="+62 812..." />
                </div>
              </div>

              <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-ink/10 pb-2 sticky top-[-1px] bg-white z-10 pt-4 mt-6">{dict.step2}</h3>
              
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.channel_name}</label>
                <input required type="text" name="channelName" value={formData.channelName} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="@fashionguru" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.ig_url}</label>
                  <input required type="url" name="instagramLink" value={formData.instagramLink} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.tiktok_url}</label>
                  <input required type="url" name="tiktokLink" value={formData.tiktokLink} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="https://tiktok.com/@..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.yt_url}</label>
                  <input required type="url" name="youtubeLink" value={formData.youtubeLink} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="https://youtube.com/c/..." />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.fb_url}</label>
                  <input required type="url" name="facebookLink" value={formData.facebookLink} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="https://facebook.com/..." />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.address}</label>
                <textarea required name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all resize-none" placeholder="Street, City, Province, Postal Code..." />
              </div>

              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.npwp}</label>
                <input type="text" name="npwp" value={formData.npwp} onChange={handleChange} className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose focus:border-rose transition-all" placeholder="00.000.000.0-000.000" />
              </div>

            </div>

            {/* Grid 3: Legal & Terms */}
            <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto no-scrollbar pr-4 space-y-4 pb-8 px-1 -mx-1">
              <div className="space-y-4 shrink-0">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-ink/10 pb-2 sticky top-0 bg-white z-10 pt-1">{dict.step3}</h3>
                <p className="text-[10px] text-ink/50">{dict.kyc_desc}</p>
                
                <div className="space-y-2">
                  <FileUploader label={dict.ktp_label} type="ktp" path={ktpUploaded} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                  {formData.instagramLink && (
                    <FileUploader label={dict.ig_insight_label} type="ig_insight" path={igInsightUploaded} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                  )}
                  {formData.tiktokLink && (
                    <FileUploader label={dict.tiktok_insight_label} type="tiktok_insight" path={tiktokInsightUploaded} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                  )}
                  {formData.youtubeLink && (
                    <FileUploader label={dict.yt_insight_label} type="yt_insight" path={ytInsightUploaded} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                  )}
                  {formData.facebookLink && (
                    <FileUploader label={dict.fb_insight_label} type="fb_insight" path={fbInsightUploaded} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                  )}
                  {!formData.instagramLink && !formData.tiktokLink && !formData.youtubeLink && !formData.facebookLink && (
                    <div className="p-4 border border-dashed border-ink/10 rounded bg-cr noise text-center text-[10px] text-ink/40 font-medium">
                      Fill platform URLs to upload insights
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-ink/10 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-ink mb-2 shrink-0">{dict.terms_title}</h3>
                <div className="bg-cr noise p-3 border border-ink/10 overflow-y-auto flex-1 mb-4 text-[10px] text-ink/70 space-y-2 font-mono leading-relaxed no-scrollbar min-h-[80px]">
                  <p><strong>{dict.t1}</strong></p>
                  <p><strong>{dict.t2}</strong></p>
                  <p><strong>{dict.t3}</strong></p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group mb-4 shrink-0">
                  <div className="pt-0.5">
                    <input required type="checkbox" name="agree_sla" className="w-4 h-4 accent-rose cursor-pointer" />
                  </div>
                  <span className="text-[11px] text-ink/70 group-hover:text-ink transition-colors leading-tight">
                    {dict.agree}
                  </span>
                </label>

                <button
                  disabled={isSubmitting || !isFormValid()}
                  type="submit"
                  className="w-full shrink-0 bg-ink text-white p-4 text-[10px] font-medium uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? dict.submitting : dict.submit}
                  {!isSubmitting && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
