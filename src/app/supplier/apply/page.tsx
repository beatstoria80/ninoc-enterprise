'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Factory, ArrowRight, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { submitSupplierApplication } from './actions';

import { usePathname } from 'next/navigation';

const DICT = {
  ID: {
    title: "Become a B2B Partner.",
    desc: "Bergabunglah dengan ekosistem NINOC sebagai produsen eksklusif. Fokus penuh pada penskalaan volume produksi dan arus kas, sementara mesin kami menangani pemasaran, branding, QC, dan distribusi B2B.",
    pillars: "Pilar Kemitraan",
    p1_title: "Pembayaran HPP Terjamin",
    p1_desc: "Anda menetapkan biaya dasar. Kami membayar dengan bersih setelah pemenuhan berhasil.",
    p2_title: "Integritas Hukum (KYC)",
    p2_desc: "Data perusahaan Anda disimpan di private vault. NINOC terbebas dari sengketa pihak ketiga.",
    p3_title: "Anonimitas Data",
    p3_desc: "Identitas pabrik Anda dilindungi. Pembeli B2B hanya melihat NINOC sebagai pusat pemenuhan.",
    form_title: "Formulir Aplikasi & KYC",
    step1: "1. Data Perusahaan",
    legal_entity: "Entitas Hukum",
    legal_name: "Nama Legal Perusahaan",
    director: "Nama Direktur / Penanggung Jawab",
    npwp: "NPWP",
    nib: "NIB (Nomor Induk Berusaha)",
    email: "Email Kontak",
    phone: "Nomor WhatsApp",
    step2: "2. Dokumen Legalitas (KYC)",
    kyc_desc: "Diperlukan sebagai alat integritas hukum. Disimpan di private vault.",
    ktp_label: "Scan KTP Direktur",
    npwp_label: "Scan NPWP Perusahaan",
    nib_label: "Sertifikat NIB",
    uploading: "Mengunggah...",
    uploaded: "File tersimpan aman.",
    upload_hint: "PDF, JPG, PNG (Max 10MB)",
    btn_upload: "Upload",
    terms_title: "Syarat & Ketentuan (OEM SLA)",
    t1: "1. HAK REBRAND: Supplier memberikan hak eksklusif kepada NINOC untuk mengemas dan memberi merek ulang barang di bawah merek dagang NINOC.",
    t2: "2. INTEGRITAS HUKUM: Supplier menjamin bahwa barang yang dipasok tidak melanggar kekayaan intelektual pihak ketiga.",
    t3: "3. KONSINYASI HUB: Barang harus diserahkan secara fisik ke Gudang Pusat NINOC untuk Quality Control. Dropshipping dari pabrik dilarang keras.",
    t4: "4. PENCAIRAN DANA: Dana HPP dikreditkan ke buku besar supplier hanya setelah konsumen akhir menerima barang tanpa sengketa retur dalam 7 hari.",
    agree: "Saya adalah perwakilan sah dari pabrik ini dan secara hukum menyetujui SLA OEM NINOC.",
    submit: "Kirim Aplikasi",
    submitting: "Mengirim...",
    error_docs: "Harap unggah seluruh dokumen legalitas (KTP, NPWP, NIB) untuk keperluan KYC dan integritas hukum.",
    file_large: "File terlalu besar. Maks 10MB.",
    upload_failed: "Gagal mengunggah: ",
    login_req: "Pastikan Anda masuk ke akun Anda"
  },
  EN: {
    title: "Become a B2B Partner.",
    desc: "Join the NINOC ecosystem as an exclusive manufacturer. Focus purely on scaling your production volume and cashflow, while our engine handles the marketing, branding, QC, and B2B distribution.",
    pillars: "Partnership Pillars",
    p1_title: "Guaranteed HPP Payouts",
    p1_desc: "You set your base cost. We pay it cleanly upon successful fulfillment.",
    p2_title: "Legal Integrity (KYC)",
    p2_desc: "Your company data is stored in a private vault. NINOC is absolved from third-party disputes.",
    p3_title: "Data Anonymity",
    p3_desc: "Your factory identity is shielded. B2B buyers only see NINOC as the fulfillment hub.",
    form_title: "Application & KYC Form",
    step1: "1. Company Data",
    legal_entity: "Legal Entity",
    legal_name: "Company Legal Name",
    director: "Director / PIC Name",
    npwp: "Tax ID (NPWP)",
    nib: "Business License Number (NIB)",
    email: "Contact Email",
    phone: "WhatsApp Number",
    step2: "2. Legal Documents (KYC)",
    kyc_desc: "Required as a tool of legal integrity. Stored in a private vault.",
    ktp_label: "Director ID Scan",
    npwp_label: "Company Tax ID Scan",
    nib_label: "NIB Certificate",
    uploading: "Uploading...",
    uploaded: "File safely stored.",
    upload_hint: "PDF, JPG, PNG (Max 10MB)",
    btn_upload: "Upload",
    terms_title: "Terms & Conditions (OEM SLA)",
    t1: "1. RIGHT TO REBRAND: Supplier grants NINOC exclusive rights to repackage, re-label, and rebrand submitted items under the NINOC trademark.",
    t2: "2. LEGAL INTEGRITY: Supplier warrants that all goods supplied do not infringe on third-party intellectual property.",
    t3: "3. HUB CONSIGNMENT: Goods must be physically deposited to the NINOC Central Warehouse for Quality Control. Dropshipping direct from factory is strictly prohibited.",
    t4: "4. PAYOUT CLEARANCE: HPP funds are credited to the supplier ledger only after the end-consumer receives the goods and the 7-day return window expires without dispute.",
    agree: "I am an authorized representative of this factory and legally agree to the NINOC OEM Service Level Agreement.",
    submit: "Submit Application",
    submitting: "Submitting...",
    error_docs: "Please upload all legal documents (ID, Tax ID, NIB) for KYC and legal integrity purposes.",
    file_large: "File too large. Max 10MB.",
    upload_failed: "Upload failed: ",
    login_req: "Ensure you are logged in to your account"
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
  type: 'ktp' | 'npwp' | 'nib'; 
  path: string | null;
  uploading: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'npwp' | 'nib') => void;
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

export default function SupplierApplicationPage() {
  const pathname = usePathname();
  const lang = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = DICT[lang];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Document states
  const [ktpPath, setKtpPath] = useState<string | null>(null);
  const [npwpPath, setNpwpPath] = useState<string | null>(null);
  const [nibPath, setNibPath] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'npwp' | 'nib') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(dict.file_large);
      return;
    }

    setUploading(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/supplier/upload-legal', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (type === 'ktp') setKtpPath(data.path);
      if (type === 'npwp') setNpwpPath(data.path);
      if (type === 'nib') setNibPath(data.path);

    } catch (err: any) {
      alert(dict.upload_failed + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ktpPath || !npwpPath || !nibPath) {
      setError(dict.error_docs);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('ktp_url', ktpPath);
    formData.append('npwp_url', npwpPath);
    formData.append('nib_url', nibPath);

    try {
      await submitSupplierApplication(formData);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setIsSubmitting(false);
    }
  };


  return (
    <div className="h-screen w-screen bg-cr noise flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      <div className="w-full max-w-[1600px] h-full max-h-[900px] flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 bg-white shadow-2xl border border-ink/5 rounded-xl overflow-hidden z-10">
        
        {/* Grid 1 - Info */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-6 bg-cr noise p-8 md:p-12 border-r border-ink/5 h-full relative">
          <div className="w-12 h-12 bg-ink text-white flex items-center justify-center rounded-none mb-4 shadow-xl relative z-10 shrink-0">
            <Factory size={24} />
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
        <div className="lg:col-span-8 p-8 md:p-12 relative flex flex-col h-full bg-white overflow-hidden">
          <h2 className="text-xl font-display font-medium text-ink mb-6 shrink-0">{dict.form_title}</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex gap-2 items-start shrink-0">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 min-h-0">
            {/* Grid 2: Data Perusahaan */}
            <div className="space-y-4 overflow-y-auto no-scrollbar pr-4 pb-8">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-ink/10 pb-2 sticky top-0 bg-white z-10 pt-1">{dict.step1}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.legal_entity}</label>
                  <select required name="legal_entity" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors">
                    <option value="PT">PT</option>
                    <option value="CV">CV</option>
                    <option value="Perorangan">Perorangan</option>
                    <option value="Firma">Firma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.legal_name}</label>
                  <input required type="text" name="legal_name" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="PT Jaya Garment" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.director}</label>
                <input required type="text" name="director_name" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="Budi Santoso" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.npwp}</label>
                  <input required type="text" name="tax_id" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="00.000.000.0-000.000" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.nib}</label>
                  <input required type="text" name="nib" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="1234567890123" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.email}</label>
                  <input required type="email" name="email" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="director@jayagarment.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">{dict.phone}</label>
                  <input required type="tel" name="phone" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="+62..." />
                </div>
              </div>
            </div>

            {/* Grid 3: Legal & Terms */}
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar pr-4 space-y-4 pb-8">
              <div className="space-y-4 shrink-0">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-ink/10 pb-2 sticky top-0 bg-white z-10 pt-1">{dict.step2}</h3>
                <p className="text-[10px] text-ink/50">{dict.kyc_desc}</p>
                
                <div className="space-y-2">
                  <FileUploader label={dict.ktp_label} type="ktp" path={ktpPath} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                  <FileUploader label={dict.npwp_label} type="npwp" path={npwpPath} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                  <FileUploader label={dict.nib_label} type="nib" path={nibPath} uploading={uploading} onUpload={handleFileUpload} dict={dict} />
                </div>
              </div>

              <div className="pt-2 border-t border-ink/10 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-ink mb-2 shrink-0">{dict.terms_title}</h3>
                <div className="bg-cr noise p-3 border border-ink/10 overflow-y-auto flex-1 mb-4 text-[10px] text-ink/70 space-y-2 font-mono leading-relaxed no-scrollbar min-h-[80px]">
                  <p><strong>{dict.t1}</strong></p>
                  <p><strong>{dict.t2}</strong></p>
                  <p><strong>{dict.t3}</strong></p>
                  <p><strong>{dict.t4}</strong></p>
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
                  disabled={isSubmitting || !ktpPath || !npwpPath || !nibPath}
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
