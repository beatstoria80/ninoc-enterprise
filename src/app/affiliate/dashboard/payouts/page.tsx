"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Building, FileText, Upload, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AffiliateProfile {
  id: string;
  balance: number;
}

interface WithdrawalHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  bank_name: string;
  account_number: string;
}

export default function PayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  
  // Form states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification docs
  const [idUploaded, setIdUploaded] = useState(false);
  const [docUploading, setDocUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: affData, error: affError } = await supabase
        .from('affiliates')
        .select('id, balance')
        .eq('user_id', user.id)
        .single();
        
      if (affError || !affData) throw new Error("Affiliate profile not found");
      setProfile(affData);

      const { data: withdrawData } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('affiliate_id', affData.id)
        .order('created_at', { ascending: false });

      if (withdrawData) setHistory(withdrawData);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);



  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!bankName || !accountNumber || !accountName || !amount) {
      setError("Mohon lengkapi semua data bank dan jumlah penarikan.");
      return;
    }
    
    const numAmount = Number(amount);
    if (numAmount < 100000) {
      setError("Minimal penarikan adalah Rp 100.000");
      return;
    }
    if (numAmount > profile.balance) {
      setError("Saldo tidak mencukupi.");
      return;
    }

    if (!idUploaded) {
      setError("Mohon unggah dokumen verifikasi (KTP/Rekening) terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.rpc('request_affiliate_withdrawal', {
        p_affiliate_id: profile.id,
        p_amount: numAmount,
        p_bank_name: bankName,
        p_account_number: accountNumber,
        p_account_name: accountName
      });

      if (error) throw error;

      setSuccessMsg("Permintaan penarikan berhasil dibuat. Tim kami akan segera memprosesnya.");
      setAmount('');
      // Refresh data
      fetchData();
    } catch (err: any) {
      setError("Gagal melakukan penarikan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadKTP = () => {
    // TODO: Implement real file upload to Supabase Storage
    alert('Fitur upload KTP akan segera tersedia. Hubungi admin untuk verifikasi manual.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-ink/50" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-medium italic uppercase tracking-tighter text-ink">
          Penarikan <span className="text-rose">Dana</span>
        </h1>
        <p className="text-xs md:text-sm text-ink/60 mt-1">Kelola rekening tujuan dan verifikasi identitas Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: BALANCE & HISTORY */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-ink text-white p-6 rounded-2xl shadow-sm relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 text-white/5">
              <Wallet size={120} />
            </div>

            <p className="text-xs font-medium uppercase tracking-wider text-white/60 mb-2">Saldo Tersedia</p>
            <p className="text-3xl font-display font-medium">Rp {(profile?.balance || 0).toLocaleString('id-ID')}</p>
          </motion.div>

          {/* HISTORY */}
          <div className="bg-white rounded-2xl border border-ink/5 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-ink/5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Riwayat Penarikan</h2>
            </div>
            <div className="divide-y divide-ink/5">
              {history.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/60 uppercase tracking-wider">
                  Belum ada riwayat penarikan
                </div>
              ) : history.map((item) => (
                <div key={item.id} className="p-5 flex justify-between items-center hover:bg-ink/[0.02] transition-colors">
                  <div>
                    <p className="font-medium text-sm text-ink">Rp {item.amount.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-ink/60 mt-1">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-xs md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                    item.status === 'completed' ? 'text-emerald-600 bg-emerald-50' :
                    item.status === 'pending' || item.status === 'processing' ? 'text-amber-600 bg-amber-50' :
                    'text-rose bg-rose/10'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORMS */}
        <div className="lg:col-span-2 space-y-6">
          
          {error && (
            <div className="p-4 bg-rose/5 border border-rose/10 text-rose text-xs font-medium flex items-center gap-2 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-2 rounded-lg">
              <CheckCircle size={16} />
              {successMsg}
            </div>
          )}

          {/* VERIFICATION FORM */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`bg-white rounded-2xl border ${idUploaded ? 'border-emerald-100' : 'border-rose/20'} shadow-sm p-6 space-y-6`}
          >
            <div className="flex justify-between items-start border-b border-ink/5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${idUploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-rose/5 text-rose'}`}>
                  {idUploaded ? <CheckCircle size={18} /> : <FileText size={18} />}
                </div>
                <div>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Verifikasi Identitas</h2>
                  <p className="text-xs text-ink/60 mt-0.5">Wajib untuk mencegah penipuan / pencucian uang</p>
                </div>
              </div>
              {!idUploaded ? (
                <span className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-rose bg-rose/10 px-2 py-1 rounded-sm">
                  Belum Lengkap
                </span>
              ) : (
                <span className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm">
                  Terverifikasi
                </span>
              )}
            </div>

            {!idUploaded && (
              <>
                <div className="bg-rose/5 border border-rose/10 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle size={16} className="text-rose shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose leading-relaxed">
                    Penarikan dana tidak dapat diproses jika dokumen verifikasi belum diunggah. Hubungi admin NINOC untuk proses verifikasi identitas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={handleUploadKTP}
                    className="border-2 border-dashed border-ink/10 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-rose transition-colors bg-ink/[0.02]"
                  >
                    <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                      {docUploading ? <Loader2 size={18} className="animate-spin text-ink/60" /> : <Upload size={18} className="text-ink/60" />}
                    </div>
                    <h3 className="text-sm font-medium text-ink mb-1">Upload KTP & Mutasi</h3>
                    <p className="text-xs md:text-[10px] text-ink/60 uppercase tracking-wider">Segera Hadir</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* WITHDRAW FORM */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-ink/5 shadow-sm p-6 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-ink/5 pb-4">
              <div className="p-2 bg-ink/5 rounded-lg text-ink">
                <Building size={18} />
              </div>
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Formulir Penarikan</h2>
                <p className="text-xs text-ink/60 mt-0.5">Komisi akan ditransfer ke rekening ini</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleWithdraw}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-2">Nama Bank</label>
                  <select 
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    required
                    className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-2.5 px-4 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
                  >
                    <option value="">Pilih Bank...</option>
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-2">Nomor Rekening</label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    required
                    placeholder="1234567890" 
                    className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-2.5 px-4 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-2">Nama Pemilik Rekening</label>
                  <input 
                    type="text" 
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    required
                    placeholder="Sesuai Buku Tabungan" 
                    className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-2.5 px-4 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-2">Jumlah Penarikan (Rp)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    required
                    min={100000}
                    max={profile?.balance || 0}
                    placeholder="Min. 100000" 
                    className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-2.5 px-4 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" 
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !idUploaded}
                  className="w-full bg-ink text-white px-5 py-3 rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-rose transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {isSubmitting ? 'Memproses...' : 'Tarik Dana Sekarang'}
                </button>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
