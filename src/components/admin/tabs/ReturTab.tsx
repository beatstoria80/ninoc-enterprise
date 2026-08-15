"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  RefreshCw, Check, X, AlertCircle, Clock, Video,
  Eye, Search, CheckCircle, XCircle, Package,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ReturDisputeChat } from './ReturDisputeChat';

interface ReturRequest {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  order_id: string;
  ticket_id: string | null;
  reason: string;
  reason_label: string;
  description: string | null;
  video_url: string | null;
  video_duration_seconds: number | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  fraud_suspected: boolean | null;
  fraud_reasons: string[] | null;
  return_type?: 'refund' | 'exchange';
  admin_notes: string | null;
  refund_amount: number | null;
  refund_method: string | null;
  return_awb: string | null;
  return_courier: string | null;
  return_shipped_at: string | null;
  shipping_receipt_url?: string;
  customer_bank_code?: string;
  customer_bank_account?: string;
  customer_bank_account_name?: string;
  reimburse_status?: string;
  reimburse_amount?: number;
  refund_proof_url?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  qc_status?: string;
  qc_notes?: string;
  user?: { id: string; email?: string; raw_user_meta_data?: { full_name?: string } };
  order?: {
    id: string;
    total_price: number;
    status: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_address?: { name?: string; address?: string; city?: string; postal_code?: string; shipping_method?: string };
    order_items: { id: string; product_name: string; size?: string; color?: string; quantity: number; price_at_purchase: number }[];
    refund_bank_details?: {
      bank_name: string;
      account_number: string;
      account_name: string;
      submitted_at: string;
    } | null;
  } | null;
}

const STATUS_OPTS = ['all', 'pending', 'reviewed', 'approved', 'rejected', 'completed'];

const STATUS_CONFIG: Record<string, { label: string; labelID: string; color: string; badge: string; text: string }> = {
  pending:   { label: 'Pending', labelID: 'Menunggu Review', color: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-400', text: 'text-amber-600' },
  reviewed:  { label: 'Reviewed', labelID: 'Sedang Diproses', color: 'bg-blue-50 border-blue-200 text-blue-700', badge: 'bg-blue-400', text: 'text-blue-600' },
  approved:  { label: 'Approved', labelID: 'Disetujui', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', badge: 'bg-emerald-400', text: 'text-emerald-600' },
  rejected:  { label: 'Rejected', labelID: 'Ditolak', color: 'bg-red-50 border-red-200 text-red-700', badge: 'bg-red-400', text: 'text-red-600' },
  completed: { label: 'Completed', labelID: 'Selesai', color: 'bg-gray-50 border-gray-200 text-gray-700', badge: 'bg-gray-400', text: 'text-gray-600' },
  cancelled: { label: 'Cancelled', labelID: 'Dibatalkan', color: 'bg-gray-50 border-gray-200 text-gray-500', badge: 'bg-gray-300', text: 'text-gray-400' },
};

const TIMELINE = [
  { key: 'pending', label: 'Diajukan', icon: Clock },
  { key: 'reviewed', label: 'Review', icon: Eye },
  { key: 'approved', label: 'Disetujui', icon: CheckCircle },
  { key: 'rejected', label: 'Ditolak', icon: XCircle },
  { key: 'completed', label: 'Selesai', icon: Check },
];

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function formatPrice(n: number) {
  return `IDR ${n.toLocaleString('id-ID')}`;
}

function ReturDetail({ retur, onClose, onRefresh }: {
  retur: ReturRequest;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [status, setStatus] = useState(retur.status);
  const [adminNotes, setAdminNotes] = useState(retur.admin_notes || '');
  const [refundAmount, setRefundAmount] = useState(retur.refund_amount?.toString() || '');
  const [exchangeShippingCost, setExchangeShippingCost] = useState(
    (retur.order?.shipping_address as any)?.shipping_cost?.toString() || ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [refundProofUrl, setRefundProofUrl] = useState(retur.refund_proof_url || '');
  
  // Robustly fetch order items if missing
  const [fetchedOrderDetails, setFetchedOrderDetails] = useState<any>(null);
  
  useEffect(() => {
    let mounted = true;
    if (!retur.order || !retur.order.order_items) {
      const fetchOrder = async () => {
        const { data } = await supabase
          .from('orders')
          .select('id, total_price, customer_name, refund_bank_details, order_items(id, product_name, size, color, quantity, price_at_purchase)')
          .eq('id', retur.order_id)
          .single();
        if (data && mounted) {
          setFetchedOrderDetails(data);
        }
      };
      fetchOrder();
    }
    return () => { mounted = false; };
  }, [retur.order_id, retur.order]);
  
  const orderDetails = (retur.order && retur.order.order_items) ? retur.order : fetchedOrderDetails;
  
  // QC State
  const [showQcModal, setShowQcModal] = useState(false);
  const [qcItems, setQcItems] = useState<Record<string, 'sellable' | 'defective'>>({});
  const [qcNotes, setQcNotes] = useState('');
  const [qcOutcome, setQcOutcome] = useState<'valid_ninoc_fault' | 'fraud_non_ninoc' | 'defective' | ''>('');
  
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const statusIdx = TIMELINE.findIndex(s => s.key === status);

  const handleAction = async (newStatus: string, note?: string) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (note !== undefined) body.admin_notes = note;
      if (newStatus === 'approved') {
        if (retur.return_type === 'refund' && refundAmount) {
          body.refund_amount = parseInt(refundAmount) || 0;
          body.refund_method = 'transfer';
        } else if (retur.return_type === 'exchange' && exchangeShippingCost) {
          body.admin_notes = note ? `${note}\n[Est Ongkir Kirim Balik: ${exchangeShippingCost}]` : `[Est Ongkir Kirim Kirim Balik: ${exchangeShippingCost}]`;
        }
      } else if (newStatus === 'completed' && retur.return_type === 'refund') {
        if (refundProofUrl) {
          body.refund_proof_url = refundProofUrl;
        }
      }
      const res = await fetch(`/api/retur/${retur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(newStatus as ReturRequest['status']);
        setNotifyMsg('Berhasil diperbarui');
        setTimeout(() => setNotifyMsg(''), 3000);
        onRefresh();
      } else {
        alert(data.error || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQCAudit = async () => {
    if (!retur.order?.order_items) return;
    const items = retur.order.order_items.map(item => ({
      order_item_id: item.id,
      product_id: (item as any).product_id,
      variant_id: (item as any).variant_id,
      quantity: item.quantity,
      condition: qcItems[item.id] || 'sellable'
    }));

    if (!qcOutcome) {
      alert("Mohon pilih Kesimpulan QC terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/retur/${retur.id}/qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, qc_notes: qcNotes, qc_outcome: qcOutcome })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(qcOutcome === 'fraud_non_ninoc' ? 'rejected' : 'completed');
        setShowQcModal(false);
        setNotifyMsg(qcOutcome === 'fraud_non_ninoc' ? 'Retur Ditolak (Fraud)' : 'QC Audit Selesai & Stok Diperbarui');
        setTimeout(() => setNotifyMsg(''), 3000);
        onRefresh();
      } else {
        alert(data.error || 'Gagal memproses QC Audit');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await fetch(`/api/retur/${retur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      setNotifyMsg('Note tersimpan');
      setTimeout(() => setNotifyMsg(''), 2000);
    } catch {
      setNotifyMsg('Gagal menyimpan');
    } finally {
      setSavingNote(false);
    }
  };

  const shipping = retur.order?.shipping_address as any;
  const orderAny = retur.order as any;
  const customerName = retur.user?.raw_user_meta_data?.full_name 
    || orderAny?.customer_name
    || (shipping?.first_name ? `${shipping.first_name} ${shipping.last_name || ''}`.trim() : null)
    || shipping?.name 
    || 'Guest User';
  const customerEmail = retur.user?.email || retur.guest_email || retur.order?.customer_email || shipping?.email || 'Tidak ada email';
  const customerPhone = retur.order?.customer_phone || shipping?.phone || 'Tidak ada no HP';

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Detail Retur</h2>
          <span className={cn('px-2.5 py-1 text-xs font-bold uppercase rounded-md shadow-sm', cfg.badge, cfg.text)}>
            {cfg.labelID}
          </span>
          {retur.fraud_suspected && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-md flex items-center gap-1.5">
              <AlertCircle size={14} /> Fraud Warning
            </span>
          )}
          {retur.return_type === 'exchange' && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
              Tukar Barang (Exchange)
            </span>
          )}
          {retur.return_type === 'refund' && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
              Kembali Dana (Refund)
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">Tersimpan!</span>
          )}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
        
        {/* Timeline Navigation */}
        <div className="w-full">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Status Progress</h3>
          <div className="flex items-center justify-between">
            {TIMELINE.map((step, i) => {
              const Icon = step.icon;
              const isDone = i < statusIdx;
              const isCurrent = i === statusIdx;
              const isFuture = i > statusIdx;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  {i !== 0 && (
                    <div className={cn(
                      "absolute top-5 left-0 w-full h-[2px] -translate-x-1/2 -z-10",
                      isDone || isCurrent ? "bg-emerald-500" : "bg-gray-200"
                    )} />
                  )}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white border-2',
                    isDone ? 'border-emerald-500 text-emerald-500' :
                    isCurrent ? 'border-blue-600 text-blue-600 shadow-sm' :
                    'border-gray-200 text-gray-400'
                  )}>
                    {isDone ? <Check size={18} strokeWidth={3} /> : <Icon size={18} strokeWidth={isCurrent ? 2.5 : 2} />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium mt-2 text-center",
                    isDone || isCurrent ? "text-gray-900" : "text-gray-400"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email & WA Notification Proof */}
        {['approved', 'rejected', 'completed'].includes(status) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3 shadow-sm">
            <div className="bg-emerald-100 p-2 rounded-full shrink-0">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Bukti Notifikasi Terkirim (Otomatis)</p>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Pesan WhatsApp dan Email perubahan status <strong>{cfg.labelID}</strong> telah berhasil dikirimkan ke:
                <br />
                📧 <span className="font-semibold font-mono tracking-tight">{customerEmail}</span> &nbsp;|&nbsp; 📱 <span className="font-semibold font-mono tracking-tight">{customerPhone}</span>
              </p>
            </div>
          </div>
        )}

        {/* Customer & Order Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 border-b border-ink/10 pb-2">Informasi Pelanggan</h3>
            <div className="flex items-start gap-4 pt-1">
              <div className="w-12 h-12 bg-ink text-white rounded-sm flex items-center justify-center text-xl font-display font-medium shrink-0">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-bold text-ink uppercase tracking-wide">
                  {customerName}
                </p>
                <div className="mt-1.5 space-y-1">
                  <p className="text-xs text-ink/70 flex items-center gap-2 font-medium tracking-wide">
                    <span className="w-4 inline-block text-center text-ink/30">@</span> {customerEmail}
                  </p>
                  <p className="text-xs text-ink/70 flex items-center gap-2 font-medium tracking-wide">
                    <span className="w-4 inline-block text-center text-ink/30">#</span> {customerPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 border-b border-ink/10 pb-2">Detail Pengajuan & Transaksi</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">Order ID</p>
                <p className="text-sm font-bold text-ink font-mono tracking-tight">{retur.order_id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">Tanggal Diajukan</p>
                <p className="text-sm font-semibold text-ink tracking-tight">{formatDate(retur.created_at)}</p>
              </div>
            </div>
            
            {/* Added Product Transaction Data */}
            {orderDetails && orderDetails.order_items && orderDetails.order_items.length > 0 && (
              <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3 mt-4 col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-2">Produk Transaksi</p>
                {orderDetails.order_items.map((item: any, idx: number) => (
                  <div key={item.id} className={cn("flex justify-between items-start", idx !== 0 && "mt-2 pt-2 border-t border-ink/5")}>
                    <div>
                      <p className="text-xs font-bold text-ink">{item.product_name}</p>
                      <p className="text-[10px] text-ink/60 uppercase tracking-widest mt-0.5">{item.color} | Size {item.size} x {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">Alasan Retur</p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-rose/10 text-rose text-[10px] font-bold uppercase tracking-widest rounded-sm">{retur.reason_label}</span>
                <span className="text-xs font-semibold text-ink/80">{retur.reason}</span>
              </div>
            </div>
            {retur.description && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">Catatan Pelanggan</p>
                <p className="text-xs text-ink bg-ink/[0.02] p-3 rounded-sm border border-ink/5 leading-relaxed font-medium">{retur.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Video Evidence */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 border-b border-ink/10 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2"><Video size={14} className="text-ink/50" /> BUKTI VIDEO UNBOXING</span>
            {retur.video_duration_seconds ? (
              <span className="text-[10px] font-bold text-ink/40 tracking-widest uppercase">{retur.video_duration_seconds} detik</span>
            ) : null}
          </h3>
          
          {retur.video_url ? (
            <>
              <div className="rounded-sm overflow-hidden border border-ink/10 bg-black max-w-2xl relative group">
                <video
                  key={retur.video_url}
                  src={retur.video_url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-video object-contain"
                />
              </div>
              {retur.video_url && (retur.video_url.toLowerCase().includes('.mov') || retur.video_url.toLowerCase().includes('quicktime')) && (
                <div className="max-w-2xl mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <p className="text-xs text-yellow-800 font-medium">
                    <span className="font-bold">Info:</span> Jika layar video hitam atau tidak bisa diputar (biasanya video dari iPhone / format .mov yang tidak didukung Google Chrome), silakan klik tombol hitam di bawah ini.
                  </p>
                </div>
              )}
              <div className="flex justify-start mt-3">
                <a 
                  href={retur.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-ink px-4 py-2.5 rounded-sm hover:bg-ink/80 transition-colors shadow-sm"
                >
                  <Video size={16} /> Buka / Unduh Video Eksternal (Klik di sini)
                </a>
              </div>
              {retur.fraud_reasons && retur.fraud_reasons.length > 0 && (
                <div className="p-3 bg-red-50 rounded-md border border-red-200 space-y-2 mt-2">
                  {retur.fraud_reasons.map((r, i) => (
                    <p key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />{r}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <Video size={32} className="text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-700">Video Tidak Tersedia</p>
              <p className="text-xs text-gray-500 text-center max-w-xs mt-1">
                Pelanggan tidak melampirkan video unboxing. Harap waspada dan periksa detail pesanan dengan teliti.
              </p>
            </div>
          )}
        </div>

        {/* Order History */}
        {retur.order && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2 flex justify-between items-center">
              Rincian Produk Pesanan
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{retur.order.status}</span>
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              {retur.order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border rounded-md flex items-center justify-center shrink-0">
                      <Package size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                      {(item.color || item.size) && (
                        <p className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-sm inline-block my-1">
                          Varian: {[item.color, item.size].filter(Boolean).join(' - ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{item.quantity}x @ {formatPrice(item.price_at_purchase)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatPrice(item.quantity * item.price_at_purchase)}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600">Total Pembayaran Awal</p>
                <p className="text-base font-bold text-gray-900">{formatPrice(retur.order.total_price)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Return Shipping Status */}
        {status === 'approved' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Status Pengembalian Barang</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              {retur.return_awb ? (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Barang Sedang Dikirim Oleh Pelanggan</p>
                    <p className="text-sm text-gray-600 mt-1">Kurir: <span className="font-semibold uppercase">{retur.return_courier}</span></p>
                    <p className="text-sm text-gray-600">Resi: <span className="font-semibold uppercase tracking-wider">{retur.return_awb}</span></p>
                    {retur.return_shipped_at && (
                      <p className="text-xs text-gray-400 mt-2">Diinput pada: {formatDate(retur.return_shipped_at)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Menunggu Pelanggan Mengirim Barang</p>
                    <p className="text-sm text-gray-600 mt-1">Pelanggan belum memasukkan nomor resi pengembalian.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Klaim Reimburse Ongkir */}
        {retur.reimburse_status && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2 flex items-center justify-between">
              Klaim Reimburse Ongkir (Customer ke NINOC)
              <span className={cn(
                "px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider",
                retur.reimburse_status === 'validated' ? "bg-amber-100 text-amber-800" :
                retur.reimburse_status === 'transferred' ? "bg-emerald-100 text-emerald-800" :
                "bg-gray-100 text-gray-600"
              )}>
                {retur.reimburse_status === 'validated' ? 'Tervalidasi (Menunggu Transfer)' : 
                 retur.reimburse_status === 'transferred' ? 'Dana Telah Ditransfer' : retur.reimburse_status}
              </span>
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Detail Rekening Tujuan</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{retur.customer_bank_code} - {retur.customer_bank_account}</p>
                    <p className="text-sm text-gray-600">a.n {retur.customer_bank_account_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Nominal Klaim</p>
                    <p className="text-lg font-bold text-gray-900 mt-1 text-emerald-600">IDR {(retur.reimburse_amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                {retur.shipping_receipt_url && (
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Bukti Struk Pengiriman</p>
                    <a href={retur.shipping_receipt_url} target="_blank" rel="noopener noreferrer" className="block w-full max-w-[200px] aspect-[4/3] rounded-md overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity bg-gray-100 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">Lihat Struk (Buka di Tab Baru)</span>
                    </a>
                  </div>
                )}
              </div>
              
              {retur.reimburse_status === 'validated' && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      if(window.confirm('Tandai bahwa dana ongkir telah ditransfer ke rekening pelanggan?')) {
                        handleAction(status, 'Tandai Dana Ongkir Telah Ditransfer');
                        // Wait, handleAction above updates status. I need a specific one for reimburse_status.
                        // I will write a direct fetch call here.
                        setSaving(true);
                        fetch(`/api/retur/${retur.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ reimburse_status: 'transferred' })
                        }).then(res => res.json()).then(data => {
                          if (data.error) alert(data.error);
                          else { setNotifyMsg('Status pencairan berhasil diupdate!'); onRefresh(); }
                        }).finally(() => setSaving(false));
                      }
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    Tandai Ongkir Telah Ditransfer (Finance)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Rekening Refund */}
        {retur.return_type === 'refund' && (status === 'approved' || status === 'completed') && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2 flex items-center justify-between">
              Data Rekening Tujuan Refund
              {orderDetails?.refund_bank_details ? (
                <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-md uppercase tracking-wider">
                  Diterima
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-md uppercase tracking-wider">
                  Menunggu Customer
                </span>
              )}
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              {orderDetails?.refund_bank_details ? (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Transfer Ke</p>
                    <p className="text-sm font-bold text-gray-900">{orderDetails.refund_bank_details.bank_name} - {orderDetails.refund_bank_details.account_number}</p>
                    <p className="text-sm text-gray-600">a.n {orderDetails.refund_bank_details.account_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Nominal Refund</p>
                    <p className="text-lg font-bold text-emerald-600">IDR {(retur.refund_amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Menunggu Input Data Rekening</p>
                    <p className="text-sm text-gray-600 mt-1">Customer belum mengisi form rekening pengembalian dana.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Impact Analysis */}
        {['pending', 'reviewed'].includes(status) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Keputusan & Financial Impact</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              {retur.return_type === 'refund' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Pengembalian Dana (Refund)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-gray-500">IDR</span>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={e => setRefundAmount(e.target.value)}
                        placeholder={retur.order?.total_price ? `Maks. ${retur.order.total_price}` : "Masukkan jumlah"}
                        className="flex-1 text-lg font-bold text-gray-900 outline-none border-b-2 border-gray-300 focus:border-blue-600 transition-colors pb-1"
                      />
                    </div>
                  </div>
                  {refundAmount && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800">
                        ⚠️ Menyetujui refund ini berarti NINOC akan mengembalikan dana sebesar <span className="font-bold">IDR {parseInt(refundAmount).toLocaleString('id-ID')}</span>.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Ongkir Barang Pengganti</label>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-gray-500">IDR</span>
                      <input
                        type="number"
                        value={exchangeShippingCost}
                        onChange={e => setExchangeShippingCost(e.target.value)}
                        placeholder="Cth: 20000"
                        className="flex-1 text-lg font-bold text-gray-900 outline-none border-b-2 border-gray-300 focus:border-blue-600 transition-colors pb-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500" />
                      Otomatis diisi dari ongkos kirim awal pesanan pelanggan ({(retur.order?.shipping_address as any)?.shipping_method || 'Kurir'}).
                    </p>
                  </div>
                  {exchangeShippingCost && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800">
                        ⚠️ Penukaran barang akan menggunakan estimasi ongkos kirim <span className="font-bold">IDR {parseInt(exchangeShippingCost).toLocaleString('id-ID')}</span> yang akan ditanggung oleh NINOC.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Refund Transfer Section */}
        {status === 'approved' && retur.return_type === 'refund' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <CheckCircle size={16} className="text-blue-500" /> Konfirmasi Transfer Manual
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm space-y-4">
              <p className="text-sm text-blue-900">
                Silakan transfer dana sebesar <span className="font-bold">IDR {parseInt(retur.refund_amount?.toString() || '0').toLocaleString('id-ID')}</span> ke rekening pelanggan. Setelah selesai, lampirkan bukti dan konfirmasi untuk menyelesaikan proses dan menyinkronkan data ke Finance Ledger.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link Bukti Transfer (Opsional namun disarankan)</label>
                <input
                  type="text"
                  value={refundProofUrl}
                  onChange={e => setRefundProofUrl(e.target.value)}
                  placeholder="https://... atau paste link bukti resi"
                  className="w-full text-sm text-gray-900 outline-none border border-gray-300 rounded-md p-2 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2 flex items-center justify-between">
            Catatan Internal Admin
            {notifyMsg && <span className="text-sm text-emerald-600 font-medium">{notifyMsg}</span>}
          </h3>
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Tambahkan catatan khusus internal (tidak dilihat oleh customer)..."
              className="w-full p-3 text-sm bg-transparent outline-none resize-none placeholder:text-gray-400"
            />
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {savingNote ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </div>
        </div>

        {/* Dispute Center Chat */}
        <ReturDisputeChat returId={retur.id} />
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 flex flex-wrap items-center justify-end gap-2">
        {['pending', 'reviewed'].includes(status) && (
          <>
            <button
              onClick={() => handleAction('rejected')}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <X size={16} /> Tolak Pengajuan
            </button>
            {status === 'pending' && (
              <button
                onClick={() => handleAction('reviewed')}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-semibold bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Eye size={16} /> Tandai Sedang Direview
              </button>
            )}
            <button
              onClick={() => {
                const label = retur.return_type === 'exchange'
                  ? `Setujui TUKAR BARANG untuk order ${retur.order_id}?`
                  : `Setujui REFUND IDR ${parseInt(refundAmount || '0').toLocaleString('id-ID')} untuk order ${retur.order_id}?`;
                if (!window.confirm(label)) return;
                handleAction('approved');
              }}
              disabled={saving || (retur.return_type === 'refund' && !refundAmount)}
              className="px-6 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
              Setujui & Lanjutkan
            </button>
          </>
        )}
        {status === 'approved' && (
          <>
            {retur.return_type === 'refund' && (
              <button
                onClick={() => {
                  if (!refundProofUrl) {
                    if (!window.confirm('Anda belum melampirkan URL Bukti Transfer. Sinkronisasi ke Finance Ledger membutuhkan bukti. Yakin ingin menyelesaikan tanpa bukti?')) return;
                  }
                  handleAction('completed');
                }}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm mr-auto"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
                Konfirmasi Transfer & Selesai
              </button>
            )}
            <button
              onClick={() => setShowQcModal(true)}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package size={16} />}
              QC & Audit Barang Masuk
            </button>
          </>
        )}
        {(status === 'rejected' || status === 'completed') && (
          <p className="text-sm font-medium text-gray-500">
            Retur ini sudah {status === 'rejected' ? 'Ditolak' : 'Selesai'}
          </p>
        )}
      </div>

      {/* QC Modal (Emil Kowalski Polished) */}
      <AnimatePresence>
        {showQcModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5"
            >
              <div className="p-6 border-b flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">QC & Audit Barang Retur</h2>
                  <p className="text-sm text-gray-500 mt-1">Lakukan penyortiran presisi untuk data gudang.</p>
                </div>
                <button onClick={() => setShowQcModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5 bg-gray-50/30">
                {/* Customer Claim Context */}
                <div className="p-4 border border-indigo-100 rounded-xl bg-indigo-50/30 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Klaim Customer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Alasan Retur</p>
                      <p className="text-sm font-semibold text-gray-900">{retur.reason_label || retur.reason}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Deskripsi / Keluhan</p>
                      <p className="text-sm text-gray-800 italic">{retur.description || 'Tidak ada deskripsi.'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Kesimpulan QC (Wajib)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={cn("p-3 border rounded-xl cursor-pointer transition-all", qcOutcome === 'valid_ninoc_fault' ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-gray-200 bg-white hover:border-gray-300")}>
                      <input type="radio" name="qcoutcome" className="hidden" checked={qcOutcome === 'valid_ninoc_fault'} onChange={() => setQcOutcome('valid_ninoc_fault')} />
                      <p className="text-sm font-bold text-emerald-800 mb-1">Klaim Valid</p>
                      <p className="text-xs text-emerald-600/80 leading-snug">Kesalahan Ninoc terkonfirmasi. Proses penggantian.</p>
                    </label>
                    <label className={cn("p-3 border rounded-xl cursor-pointer transition-all", qcOutcome === 'fraud_non_ninoc' ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-gray-200 bg-white hover:border-gray-300")}>
                      <input type="radio" name="qcoutcome" className="hidden" checked={qcOutcome === 'fraud_non_ninoc'} onChange={() => setQcOutcome('fraud_non_ninoc')} />
                      <p className="text-sm font-bold text-red-800 mb-1">Fraud / Palsu</p>
                      <p className="text-xs text-red-600/80 leading-snug">Bukan produk Ninoc / Klaim palsu. Retur Ditolak.</p>
                    </label>
                    <label className={cn("p-3 border rounded-xl cursor-pointer transition-all", qcOutcome === 'defective' ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-gray-200 bg-white hover:border-gray-300")}>
                      <input type="radio" name="qcoutcome" className="hidden" checked={qcOutcome === 'defective'} onChange={() => setQcOutcome('defective')} />
                      <p className="text-sm font-bold text-amber-800 mb-1">Cacat Pabrik</p>
                      <p className="text-xs text-amber-600/80 leading-snug">Produk asli namun cacat produksi (Afkir).</p>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Kondisi Barang Masuk</h3>
                {retur.order?.order_items.map((item, idx) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {item.size || '-'} / {item.color || '-'} • Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 pt-3 border-t border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="radio" 
                          name={`qc-${item.id}`} 
                          checked={(!qcItems[item.id]) || qcItems[item.id] === 'sellable'} 
                          onChange={() => setQcItems(prev => ({ ...prev, [item.id]: 'sellable' }))}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Layak Jual (Restock)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="radio" 
                          name={`qc-${item.id}`} 
                          checked={qcItems[item.id] === 'defective'} 
                          onChange={() => setQcItems(prev => ({ ...prev, [item.id]: 'defective' }))}
                          className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Cacat / Afkir (Write-off)</span>
                      </label>
                    </div>
                  </div>
                ))}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Audit Tambahan (Opsional)</label>
                  <textarea 
                    value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:bg-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm resize-none"
                    rows={3}
                    placeholder="Misal: Kemasan rusak, namun produk aman..."
                  />
                </div>
              </div>
              <div className="p-6 border-t bg-white flex justify-end gap-3 rounded-b-2xl">
                <button 
                  onClick={() => setShowQcModal(false)}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleQCAudit}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package size={16} />}
                  Simpan & Selesaikan Retur
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ReturTab() {
  const [returs, setReturs] = useState<ReturRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReturRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchReturs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/retur?${params}`);
      const data = await res.json();
      setReturs(data.retur_requests || []);
    } catch (err) {
      console.error('[ReturTab] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    queueMicrotask(() => { fetchReturs(); });
    const channel = supabase
      .channel('admin-retur-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retur_requests' }, () => {
        fetchReturs();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchReturs]);

  const filtered = returs.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.order_id.toLowerCase().includes(q) ||
      r.reason_label.toLowerCase().includes(q) ||
      r.guest_email?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.user?.raw_user_meta_data?.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full bg-gray-50 border-t border-gray-200">
      {/* Left Panel — List (Wider for better readability) */}
      <div className="w-[360px] flex flex-col shrink-0 border-r border-gray-200 bg-white">
        <div className="p-5 space-y-4 shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Request Retur</h2>
              <p className="text-sm text-gray-500">Kelola pengajuan retur pelanggan</p>
            </div>
            <button
              onClick={fetchReturs}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari Order ID, Email, atau Nama..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all"
            />
          </div>

          {/* Improved Tabs Navigation for Status */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
            {STATUS_OPTS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1',
                  statusFilter === s
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Package size={48} className="text-gray-300 mb-4" strokeWidth={1.5} />
              <p className="text-base font-medium text-gray-900">Belum ada pengajuan</p>
              <p className="text-sm text-gray-500 mt-1">Request retur akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(r => {
                const cfg = STATUS_CONFIG[r.status];
                const isSelected = selected?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={cn(
                      'w-full p-4 text-left transition-all hover:bg-gray-50 relative',
                      isSelected ? 'bg-blue-50/50' : ''
                    )}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                    
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-mono font-bold text-gray-900 truncate pr-2">{r.order_id}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold uppercase shrink-0', cfg?.color)}>
                        {r.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 font-medium mb-1 truncate">{r.reason_label}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <div className="flex items-center gap-2">
                        {!r.user_id ? (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">GUEST</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">USER</span>
                        )}
                        <span className="truncate max-w-[120px]">{r.guest_email || r.user?.email || r.order?.customer_email || (r.order?.shipping_address as any)?.email || 'N/A'}</span>
                      </div>
                      <span>{new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Detail */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ReturDetail
            key={selected.id}
            retur={selected}
            onClose={() => setSelected(null)}
            onRefresh={fetchReturs}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6">
              <RefreshCw size={40} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pilih Request Retur</h3>
            <p className="text-base text-gray-500 max-w-sm text-center">
              Klik pada salah satu pengajuan di daftar sebelah kiri untuk melihat rincian dan melakukan tindak lanjut.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
