"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutRequestButtonProps {
  availableBalance: number;
  supplierId: string;
  initialBankName: string;
  initialAccountNumber: string;
  initialAccountName: string;
}

export function PayoutRequestButton({
  availableBalance,
  supplierId,
  initialBankName,
  initialAccountNumber,
  initialAccountName
}: PayoutRequestButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [amount, setAmount] = useState<number>(availableBalance);
  const [bankName, setBankName] = useState<string>(initialBankName);
  const [accountNumber, setAccountNumber] = useState<string>(initialAccountNumber);
  const [accountName, setAccountName] = useState<string>(initialAccountName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error('Jumlah penarikan harus lebih besar dari 0');
      return;
    }

    if (amount > availableBalance) {
      toast.error('Jumlah penarikan tidak boleh melebihi saldo tersedia');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      toast.error('Semua data bank harus diisi lengkap');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/supplier/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bankName,
          accountNumber,
          accountName
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat memproses penarikan');
      }

      toast.success('Pengajuan penarikan dana berhasil dikirim!');
      setIsOpen(false);
      
      // Refresh server data without full page reload
      setTimeout(() => {
        router.refresh();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal mengirimkan pengajuan penarikan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setAmount(availableBalance);
          setIsOpen(true);
        }}
        disabled={availableBalance <= 0}
        className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed text-center block"
      >
        Request Payout
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white">
              <h3 className="font-bold text-lg">Request Payout</h3>
              <p className="text-emerald-100 text-xs mt-1">Ajukan pencairan dana virtual inventory Anda ke rekening bank.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1">Saldo Tersedia</label>
                <div className="text-lg font-bold text-emerald-600">
                  Rp {availableBalance.toLocaleString('id-ID')}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1">Jumlah Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-600 transition-all font-mono"
                  placeholder="Masukkan jumlah nominal"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-3">Informasi Rekening Bank Tujuan</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 transition-all"
                      placeholder="Contoh: BCA, Mandiri, BNI"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 transition-all font-mono"
                      placeholder="Masukkan nomor rekening"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 transition-all"
                      placeholder="Masukkan nama pemilik rekening"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || amount <= 0 || amount > availableBalance}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Memproses...' : (
                    <>
                      <DollarSign size={14} />
                      <span>Ajukan Payout</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
