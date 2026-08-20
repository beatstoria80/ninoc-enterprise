"use client";

import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUpRight, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutRequest {
  id: string;
  supplier_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  suppliers: {
    name: string;
  } | null;
}

export function PayoutRequestsTab() {
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/withdrawals');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal mengambil data penarikan');
      setRequests(result.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleProcess = async (id: string, status: 'approved' | 'rejected') => {
    const confirmMsg = status === 'approved' 
      ? 'Apakah Anda yakin ingin menyetujui penarikan ini? Saldo supplier akan didebit secara otomatis.'
      : 'Apakah Anda yakin ingin menolak penarikan ini?';

    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(id);
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memperbarui status penarikan');

      toast.success(status === 'approved' ? 'Penarikan berhasil disetujui!' : 'Penarikan telah ditolak.');
      await fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const supplierName = r.suppliers?.name || '';
    const matchesSearch = supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.account_number.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0 });

  return (
    <div className="space-y-4 w-full pb-20">
      {/* Header card */}
      <div className="bg-white border border-ink/10 rounded-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink/5 flex items-center justify-center text-ink shrink-0">
            <Landmark size={16} />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink font-display">PAYOUT REQUESTS MANAGEMENT</h2>
            <p className="text-[10px] text-ink/60 tracking-wider">Verifikasi dan setujui penarikan saldo virtual inventory supplier.</p>
          </div>
        </div>

        <button 
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-ink/10 hover:bg-ink/5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-ink/10 rounded-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Cari nama supplier, bank, atau rekening..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-ink/10 rounded-sm text-xs focus:outline-none focus:border-ink/40"
          />
          <Search size={14} className="absolute left-3 top-3 text-ink/40" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink/50 shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-ink/10 rounded-sm text-xs focus:outline-none bg-white w-full md:w-40"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F4F4F5] border-b border-ink/10 text-xs font-semibold text-ink/80 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 border-r border-ink/5">Tanggal Pengajuan</th>
                <th className="px-5 py-3 border-r border-ink/5">Supplier</th>
                <th className="px-5 py-3 border-r border-ink/5">Informasi Rekening Bank</th>
                <th className="px-5 py-3 border-r border-ink/5 text-right">Jumlah Payout</th>
                <th className="px-5 py-3 border-r border-ink/5 text-center">Status</th>
                <th className="px-5 py-3 text-center">Aksi / Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center text-ink/40 uppercase tracking-widest font-medium">
                    <span className="animate-pulse">Memuat data pengajuan...</span>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink/40 uppercase tracking-widest">
                    Tidak ada pengajuan penarikan ditemukan.
                  </td>
                </tr>
              ) : filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-ink/[0.01]">
                  <td className="px-5 py-4 border-r border-ink/5 font-mono text-ink/75">
                    {new Date(req.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-5 py-4 border-r border-ink/5 font-semibold text-ink">
                    {req.suppliers?.name || 'N/A'}
                  </td>
                  <td className="px-5 py-4 border-r border-ink/5">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-ink">{req.bank_name}</div>
                      <div className="font-mono text-ink/75">{req.account_number}</div>
                      <div className="text-[10px] text-ink/65">a.n {req.account_name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 border-r border-ink/5 text-right font-bold text-ink font-mono">
                    Rp {fIDR(Number(req.amount))}
                  </td>
                  <td className="px-5 py-4 border-r border-ink/5 text-center">
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Approved
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled={processingId !== null}
                          onClick={() => handleProcess(req.id, 'approved')}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={12} />
                          <span>Setujui</span>
                        </button>
                        <button
                          disabled={processingId !== null}
                          onClick={() => handleProcess(req.id, 'rejected')}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          <span>Tolak</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-ink/40 uppercase font-semibold">Selesai Diproses</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
