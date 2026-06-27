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
    <div className="max-w-md mx-auto space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-3">
          <Search size={20} className="text-ink/60" />
        </div>
        <h2 className="text-lg font-bold text-ink">Lacak Pengajuan Retur</h2>
        <p className="text-xs text-ink/50 max-w-sm mx-auto">
          Masukkan Nomor Order (misal: NINOC-...) atau Nomor Invoice (misal: 120) untuk mengecek status retur Anda.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID / No. Invoice"
            className="w-full pl-9 pr-4 py-2.5 bg-ink/[0.02] border border-ink/10 rounded-sm text-sm outline-none focus:border-rose focus:ring-1 focus:ring-rose transition-all"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-2.5 bg-ink text-white text-sm font-semibold uppercase tracking-wider rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Lacak'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-sm flex items-start gap-3">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-5 border border-ink/10 rounded-sm bg-white space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start border-b border-ink/5 pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold mb-1">Order ID</p>
              <p className="text-sm font-mono font-bold text-ink">{result.order_id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold mb-1">Tanggal</p>
              <p className="text-xs text-ink">{new Date(result.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 pt-1">
            {(() => {
              const cfg = STATUS_MAP[result.status] || STATUS_MAP.pending;
              const Icon = cfg.icon;
              return (
                <>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${cfg.color.replace('text-', 'bg-').replace('600', '50')} ${cfg.color.replace('text-', 'border-').replace('600', '200')}`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</h3>
                    <p className="text-xs text-ink/60 mt-1 leading-relaxed">{cfg.desc}</p>
                    
                    <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 bg-ink/[0.03] rounded-sm">
                      <span className="text-[10px] uppercase tracking-wider text-ink/40 font-bold">Jenis Klaim:</span>
                      <span className="text-[11px] font-semibold text-ink/80">{result.return_type === 'exchange' ? 'Tukar Barang' : 'Refund Dana'}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
