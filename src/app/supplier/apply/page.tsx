'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Factory, ArrowRight, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { submitSupplierApplication } from './actions';

export default function SupplierApplicationPage() {
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
      alert('File too large. Max 10MB.');
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
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ktpPath || !npwpPath || !nibPath) {
      setError('Harap unggah seluruh dokumen legalitas (KTP, NPWP, NIB) untuk keperluan KYC dan integritas hukum.');
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

  const FileUploader = ({ label, type, path }: { label: string, type: 'ktp' | 'npwp' | 'nib', path: string | null }) => (
    <div className="border border-dashed border-ink/20 p-4 rounded bg-white/50 group hover:border-rose/50 transition-colors">
      <label className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded flex items-center justify-center ${path ? 'bg-emerald-50 text-emerald-600' : 'bg-ink/5 text-ink/40'}`}>
            {path ? <CheckCircle size={18} /> : <FileText size={18} />}
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink uppercase tracking-wider">{label}</p>
            <p className="text-[10px] text-ink/50 mt-0.5">
              {uploading === type ? 'Mengunggah...' : path ? 'File tersimpan aman.' : 'PDF, JPG, PNG (Max 10MB)'}
            </p>
          </div>
        </div>
        {!path && uploading !== type && (
          <div className="text-[10px] uppercase font-medium bg-ink/5 px-3 py-1.5 rounded text-ink/60 group-hover:bg-rose group-hover:text-white transition-colors">
            Upload
          </div>
        )}
        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, type)} disabled={uploading === type} />
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-cr noise py-12 px-4 flex justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        
        {/* Left Side - Info */}
        <div className="flex flex-col justify-center space-y-6 md:sticky md:top-12 md:h-fit">
          <div className="w-12 h-12 bg-ink text-white flex items-center justify-center rounded-none mb-4">
            <Factory size={24} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display italic font-medium tracking-tight text-ink">
            Become a B2B Partner.
          </h1>
          <p className="text-sm text-ink/70 leading-relaxed max-w-md">
            Join the NINOC ecosystem as an exclusive manufacturer. Focus purely on scaling your production volume and cashflow, while our engine handles the marketing, branding, QC, and B2B distribution.
          </p>
          
          <div className="pt-6 border-t border-ink/10 space-y-4">
            <h3 className="text-[10px] uppercase font-medium tracking-[0.2em] text-ink/50">Partnership Pillars</h3>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">Guaranteed HPP Payouts</p>
                <p className="text-[10px] text-ink/60">You set your base cost. We pay it cleanly upon successful fulfillment.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">Legal Integrity (KYC)</p>
                <p className="text-[10px] text-ink/60">Data perusahaan Anda disimpan di private vault. NINOC terbebas dari sengketa pihak ketiga.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">Data Anonymity</p>
                <p className="text-[10px] text-ink/60">Your factory identity is shielded. B2B buyers only see NINOC as the fulfillment hub.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white p-8 md:p-12 border border-ink/5 shadow-2xl relative overflow-hidden">
          <h2 className="text-xl font-display font-medium text-ink mb-6">Application & KYC Form</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex gap-2 items-start">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-ink/10 pb-2">1. Data Perusahaan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">Entitas Hukum</label>
                  <select required name="legal_entity" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors">
                    <option value="PT">PT</option>
                    <option value="CV">CV</option>
                    <option value="Perorangan">Perorangan</option>
                    <option value="Firma">Firma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">Nama Legal Perusahaan</label>
                  <input required type="text" name="legal_name" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="PT Jaya Garment" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">Nama Direktur / Penanggung Jawab</label>
                <input required type="text" name="director_name" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="Budi Santoso" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">NPWP</label>
                  <input required type="text" name="tax_id" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="00.000.000.0-000.000" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">NIB (Nomor Induk Berusaha)</label>
                  <input required type="text" name="nib" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="1234567890123" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">Email Kontak</label>
                  <input required type="email" name="email" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="director@jayagarment.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">WhatsApp Number</label>
                  <input required type="tel" name="phone" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="+62..." />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-ink/10 pb-2">2. Dokumen Legalitas (KYC)</h3>
              <p className="text-[10px] text-ink/50">Diperlukan sebagai alat integritas hukum. Disimpan di private vault.</p>
              
              <div className="space-y-3">
                <FileUploader label="Scan KTP Direktur" type="ktp" path={ktpPath} />
                <FileUploader label="Scan NPWP Perusahaan" type="npwp" path={npwpPath} />
                <FileUploader label="Sertifikat NIB" type="nib" path={nibPath} />
              </div>
            </div>

            <div className="pt-6 border-t border-ink/10">
              <h3 className="text-xs font-bold text-ink mb-4">Terms & Conditions (OEM SLA)</h3>
              <div className="bg-cr noise p-4 border border-ink/10 h-40 overflow-y-auto mb-4 text-[10px] text-ink/70 space-y-3 font-mono leading-relaxed">
                <p><strong>1. RIGHT TO REBRAND:</strong> Supplier grants NINOC exclusive rights to repackage, re-label, and rebrand submitted items under the NINOC trademark.</p>
                <p><strong>2. LEGAL INTEGRITY:</strong> Supplier warrants that all goods supplied do not infringe on third-party intellectual property. NINOC is absolved from any legal dispute arising from the supplier's production methods.</p>
                <p><strong>3. HUB CONSIGNMENT:</strong> Goods must be physically deposited to the NINOC Central Warehouse for Quality Control. Dropshipping direct from factory is strictly prohibited to preserve brand anonymity.</p>
                <p><strong>4. PAYOUT CLEARANCE:</strong> HPP funds are credited to the supplier ledger only after the end-consumer receives the goods and the 7-day return window expires without dispute.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="pt-0.5">
                  <input required type="checkbox" name="agree_sla" className="w-4 h-4 accent-rose cursor-pointer" />
                </div>
                <span className="text-xs text-ink/70 group-hover:text-ink transition-colors">
                  I am an authorized representative of this factory and legally agree to the NINOC OEM Service Level Agreement stated above.
                </span>
              </label>
            </div>

            <button
              disabled={isSubmitting || !ktpPath || !npwpPath || !nibPath}
              type="submit"
              className="w-full bg-ink text-white p-4 text-[10px] font-medium uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
              {!isSubmitting && <ArrowRight size={14} />}
            </button>
            <p className="text-center text-[9px] text-ink/40 uppercase tracking-widest mt-4">
              Ensure you are logged in to your account
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
