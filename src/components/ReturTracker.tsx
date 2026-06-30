"use client";

import React, { useState } from 'react';
import { Search, Loader2, Package, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  pending: { label: 'Menunggu Review', icon: Clock, color: 'text-amber-600', desc: 'Pengajuan Anda sedang dalam antrean untuk direview oleh tim kami.' },
  reviewed: { label: 'Sedang Diproses', icon: Search, color: 'text-blue-600', desc: 'Tim kami sedang mengecek detail pesanan dan bukti video Anda.' },
  approved: { label: 'Disetujui', icon: CheckCircle2, color: 'text-emerald-600', desc: 'Pengajuan retur Anda disetujui. Dana/Barang sedang diproses.' },
  completed: { label: 'Selesai', icon: CheckCircle2, color: 'text-gray-600', desc: 'Proses retur telah selesai sepenuhnya.' },
  rejected: { label: 'Ditolak', icon: XCircle, color: 'text-red-600', desc: 'Pengajuan retur ditolak. Silakan cek catatan admin atau hubungi CS.' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-gray-500', desc: 'Pengajuan retur dibatalkan.' },
};

export function ReturTracker() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/retur/track?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-3 py-2">
      <div className="text-center space-y-1">
        <div className="w-9 h-9 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-1.5">
          <Search size={16} className="text-ink/60" />
        </div>
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Lacak Pengajuan Retur</h2>
        <p className="text-[10px] text-ink/70 max-w-xs mx-auto leading-snug">
          Masukkan Nomor Order (misal: NINOC-...) atau Nomor Invoice untuk mengecek status retur Anda.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Package size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID / No. Invoice"
            className="w-full pl-8 pr-3 py-2 bg-ink/[0.02] border border-ink/10 rounded-sm text-xs outline-none focus:border-rose focus:ring-1 focus:ring-rose transition-all"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-ink text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[72px]"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Lacak'}
        </button>
      </form>

      {error && (
        <div className="px-2.5 py-2 bg-red-50 border border-red-100 rounded-sm flex items-start gap-2">
          <AlertCircle size={13} className="text-red-600 shrink-0 mt-px" />
          <p className="text-[10px] text-red-700 leading-snug">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-3 border border-ink/10 rounded-sm bg-white space-y-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start border-b border-ink/5 pb-2">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-ink/70 font-semibold mb-0.5">Order ID</p>
              <p className="text-xs font-mono font-bold text-ink">{result.order_id}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-ink/70 font-semibold mb-0.5">Tanggal</p>
              <p className="text-[10px] text-ink">{new Date(result.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5">
            {(() => {
              const cfg = STATUS_MAP[result.status] || STATUS_MAP.pending;
              const Icon = cfg.icon;
              return (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${cfg.color.replace('text-', 'bg-').replace('600', '50')} ${cfg.color.replace('text-', 'border-').replace('600', '200')}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</h3>
                    <p className="text-[10px] text-ink/70 mt-0.5 leading-snug">{cfg.desc}</p>
                    
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 bg-ink/[0.03] rounded-sm">
                      <span className="text-[9px] uppercase tracking-wider text-ink/60 font-bold">Klaim:</span>
                      <span className="text-[11px] font-semibold text-ink/80">{result.return_type === 'exchange' ? 'Tukar Barang' : 'Refund Dana'}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* QC Audit Results */}
          {result.status === 'completed' && result.qc_status === 'valid_ninoc_fault' && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 mb-0.5">QC Audit: Klaim Valid</p>
              <p className="text-xs text-emerald-700 leading-snug">
                Mohon maaf atas kesalahan kami. Barang telah diperiksa di gudang dan proses penggantian (Exchange) atau Refund sedang diproses.
              </p>
            </div>
          )}
          {result.status === 'rejected' && result.qc_status === 'fraud_non_ninoc' && (
            <div className="bg-red-50 border border-red-100 rounded-sm p-2.5 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-0.5">RETUR DITOLAK (FRAUD)</p>
                <p className="text-xs text-red-700 leading-snug font-medium">
                  Barang yang dikembalikan tidak sesuai / bukan produk Ninoc asli. Klaim retur dibatalkan sepihak oleh sistem.
                </p>
                {result.qc_notes && <p className="text-[10px] text-red-500 mt-1 italic">Catatan Gudang: {result.qc_notes}</p>}
              </div>
            </div>
          )}
          
          {/* Instruksi Pengiriman & Resi untuk Guest */}
          {result.status === 'approved' && !result.return_awb && (
            <div className="bg-ink/[0.02] border border-ink/10 rounded-sm p-2.5 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink flex items-center gap-1"><Package size={10}/> Tindakan: Kirim Barang</p>
              <p className="text-[10px] text-ink/70 leading-snug">
                Retur disetujui. Kemas barang dan kirimkan ke:<br/>
                <strong>Gudang NINOC Archive</strong><br/>
                Jl. Sudirman No. 123, Jakarta Selatan<br/>
                <span className="text-[9px] italic opacity-70">(Ongkir ditanggung pembeli kecuali ada kesepakatan lain)</span>
              </p>
              <div className="pt-1.5 border-t border-ink/5">
                <p className="text-[10px] font-semibold text-ink/80 mb-1.5">Input Resi Pengembalian</p>
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <input 
                    type="text" 
                    id={`courier-${result.id}`}
                    placeholder="Kurir (JNT/JNE/...)" 
                    className="w-full sm:w-1/3 px-2 py-1.5 text-[10px] border border-ink/10 rounded-sm bg-white focus:outline-none focus:border-ink/30"
                  />
                  <input 
                    type="text" 
                    id={`awb-${result.id}`}
                    placeholder="Nomor Resi / AWB" 
                    className="w-full sm:flex-1 px-2 py-1.5 text-[10px] border border-ink/10 rounded-sm bg-white focus:outline-none focus:border-ink/30"
                  />
                  <button 
                    onClick={async () => {
                      const courier = (document.getElementById(`courier-${result.id}`) as HTMLInputElement)?.value;
                      const awb = (document.getElementById(`awb-${result.id}`) as HTMLInputElement)?.value;
                      if (!courier || !awb) return alert('Kurir dan Resi wajib diisi');
                      try {
                        const res = await fetch(`/api/retur/${result.id}/shipping`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ return_courier: courier, return_awb: awb, order_id: result.order_id })
                        });
                        if(res.ok) {
                          alert('Resi berhasil disimpan!');
                          setResult((prev: any) => ({ ...prev, return_courier: courier, return_awb: awb }));
                        }
                        else alert('Gagal menyimpan resi');
                      } catch(e) { alert('Error: ' + e); }
                    }}
                    className="px-2.5 py-1.5 bg-ink text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-rose transition-colors whitespace-nowrap"
                  >
                    Submit Resi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Resi Terkirim */}
          {result.return_awb && (
            <div className="bg-blue-50 border border-blue-100 rounded-sm p-2.5 flex items-start gap-2">
              <Package size={14} className="text-blue-500 mt-px" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600 mb-0.5">Barang Dikirim Kembali</p>
                <p className="text-xs font-bold text-blue-800">{result.return_courier?.toUpperCase()} - {result.return_awb}</p>
                <p className="text-[10px] text-blue-600/80 mt-0.5">Tim gudang akan memproses setelah paket tiba.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
