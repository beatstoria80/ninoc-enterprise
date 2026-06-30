"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Package, AlertCircle, Check, ChevronLeft, ChevronRight, Upload, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface ReturnModalProps {
  orderId: string;
  userId: string;
  items: { id: string; product_name?: string; size?: string; quantity: number; price_at_purchase: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

const EASING = { out: [0.23, 1, 0.32, 1] as const };

const RETURN_REASONS = [
  { value: 'rusak_cacat', label: 'Barang Rusak / Cacat Produksi', desc: 'Barang cacat atau rusak dari pabrik' },
  { value: 'salah_ukuran', label: 'Salah Ukuran', desc: 'Ukuran tidak sesuai yang dipesan' },
  { value: 'salah_warna', label: 'Salah Warna / Model', desc: 'Warna/model tidak sesuai pesanan' },
  { value: 'tidak_sesuai', label: 'Tidak Sesuai Deskripsi', desc: 'Produk tidak sesuai deskripsi website' },
  { value: 'lainnya', label: 'Lainnya', desc: 'Alasan lain' },
];

const TERMS = [
  'Pengajuan retur maksimal 2x24 jam setelah pesanan berstatus Diterima.',
  'Barang belum digunakan, dicuci, atau dimodifikasi, serta hangtag utuh.',
  'Bukti unboxing video diambil dalam 1-shot (15-30s) tanpa edit/potong.',
  'Persetujuan akhir bergantung pada hasil Audit QC Fisik oleh Tim Gudang.',
  'Klaim otomatis DITOLAK jika terdeteksi FRAUD (bukan produk NINOC asli).',
];

const VIDEO_GUIDE = [
  'Rekam saat membuka paket dari keadaan tertutup',
  'Tunjukkan kondisi barang dengan jelas',
  'WAJIB 1-shot — tanpa edit, potong, henti, atau sisipkan adegan',
  'Timestamp/waktu harus terlihat jelas',
  'Durasi video wajib 15 - 30 detik',
];

export function ReturnModal({ orderId, userId, items, onClose, onSuccess }: ReturnModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() =>
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
  );
  const [reason, setReason] = useState('');
  const [reasonValue, setReasonValue] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[itemId] > 0) {
        next[itemId] = 0;
      } else {
        next[itemId] = items.find(i => i.id === itemId)?.quantity || 1;
      }
      return next;
    });
  };

  const handleVideoSelect = useCallback((file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setError('Ukuran video maksimal 50MB');
      return;
    }
    const allowedTypes = ['video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format video harus MP4 atau WebM');
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      if (duration < 15 || duration > 30) {
        setError('Durasi video unboxing harus 15 hingga 30 detik (1-shot)');
        URL.revokeObjectURL(url);
      } else {
        setVideoFile(file);
        setVideoUrl(url);
        setVideoDuration(duration);
        setError('');
      }
    };
  }, []);

  const handleTermsScroll = () => {
    if (termsRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setTermsScrolled(true);
      }
    }
  };

  // Auto-detect when terms content fits without needing scroll
  useEffect(() => {
    if (step === 3 && termsRef.current && !termsScrolled) {
      const { scrollHeight, clientHeight } = termsRef.current;
      if (clientHeight >= scrollHeight - 10) {
        setTermsScrolled(true);
      }
    }
  }, [step, termsScrolled]);

  const selectedCount = Object.entries(selectedItems).filter(([, qty]) => qty > 0).length;
  const selectedTotal = Object.entries(selectedItems)
    .filter(([, qty]) => qty > 0)
    .reduce((sum, [itemId, qty]) => {
      const item = items.find(i => i.id === itemId);
      return sum + (item ? item.price_at_purchase * qty : 0);
    }, 0);

  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
  const canProceedStep1 = selectedCount > 0;
  const canProceedStep2 =
    description.trim().length >= 10 &&
    (isProduction ? videoFile !== null : true) &&
    reasonValue !== '';
  const canProceedStep3 =
    canProceedStep2 &&
    termsAccepted &&
    (isProduction ? termsScrolled : true);

  const handleSubmit = async () => {
    if (!canProceedStep3) return;
    setIsSubmitting(true);
    setError('');

    try {
      let finalVideoUrl = '';
      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('retur_id', `temp-${Date.now()}`); // We don't have returId yet
        
        const uploadRes = await fetch('/api/retur/upload-video', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Gagal upload video ke server');
        }
        
        const uploadData = await uploadRes.json();
        finalVideoUrl = uploadData.video_url;
      }

      const res = await fetch('/api/retur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          reason: reasonValue,
          reason_label: RETURN_REASONS.find(r => r.value === reasonValue)?.label || reasonValue,
          description: description.trim(),
          video_url: finalVideoUrl,
          video_duration_seconds: videoDuration,
          video_filename: videoFile?.name || '',
          user_id: userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal提交 retur');

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white w-full max-w-md shadow-2xl rounded-sm overflow-hidden p-6"
        >
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center"
            >
              <Check size={24} strokeWidth={2.5} className="text-white" />
            </motion.div>
            <div>
              <p className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink">Pengajuan Terkirim!</p>
              <h3 className="text-[13px] font-display italic font-medium text-ink mt-1">Retur Diajukan</h3>
              <p className="text-xs md:text-[9px] text-ink/60 mt-1 max-w-[240px]">
                Pengajuan retur untuk order <span className="font-semibold text-ink">{orderId}</span> telah kami terima.
                Tim akan meninjaunya dalam 1–2 hari kerja.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: EASING.out }}
        className="relative bg-white w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between shrink-0 bg-ink/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-rose/10 rounded-sm flex items-center justify-center">
              <RefreshCw size={12} className="text-rose" />
            </div>
            <div>
              <h2 className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink">Ajukan Retur</h2>
              <p className="text-[10px] md:text-[7px] text-ink/50 uppercase tracking-widest mt-0.5">Return & Refund</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-ink/50 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-0">
                {s > 1 ? <div className={cn('h-px flex-1 transition-colors', step >= s ? 'bg-rose' : 'bg-ink/5')} /> : null}
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[11px] md:text-[8px] font-bold transition-colors shrink-0',
                  step >= s ? 'bg-rose text-white' : 'bg-ink/5 text-ink/50'
                )}>
                  {step > s ? <Check size={9} strokeWidth={3} /> : s}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['Pilih Item', 'Detail & Video', 'Syarat'].map((label, i) => (
              <p key={label} className={cn('text-[10px] md:text-[7px] mt-1', i + 1 <= step ? 'text-rose font-semibold' : 'text-ink/20')}>{label}</p>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Item Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto minimal-scroll px-5 pb-5 space-y-4"
            >
              {/* Return Type */}
              <div>
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-2">Tipe Retur</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'refund' as const, label: 'Refund', desc: 'Dana kembali ke pembayaran asli' },
                    { id: 'exchange' as const, label: 'Exchange', desc: 'Tukar dengan produk lain' },
                  ].map(opt => (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setReturnType(opt.id)}
                      className={cn(
                        'p-3 border text-left transition-all duration-200 rounded-sm',
                        returnType === opt.id ? 'border-rose bg-rose/5 shadow-sm' : 'border-ink/5 hover:border-ink/15 bg-white'
                      )}
                    >
                      <p className={cn('text-xs md:text-[10px] font-bold uppercase tracking-wider mb-1', returnType === opt.id ? 'text-rose' : 'text-ink/50')}>{opt.label}</p>
                      <p className="text-[11px] md:text-[8px] text-ink/60 leading-relaxed">{opt.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Select Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50">Pilih Item</p>
                  <span className={cn("px-2 py-0.5 text-[10px] md:text-[7px] font-bold rounded-sm", selectedCount > 0 ? "bg-rose/10 text-rose" : "bg-ink/5 text-ink/50")}>
                    {selectedCount} dipilih
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const isSelected = selectedItems[item.id] > 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 border cursor-pointer transition-all duration-200 rounded-sm',
                          isSelected ? 'border-rose/40 bg-rose/[0.03] shadow-sm' : 'border-ink/5 hover:border-ink/15 hover:bg-ink/[0.01]'
                        )}
                      >
                        <div className={cn('w-4.5 h-4.5 border flex items-center justify-center shrink-0 transition-all duration-200 rounded-sm', isSelected ? 'bg-rose border-rose' : 'border-ink/20 bg-white')}>
                          {isSelected && <Check size={9} strokeWidth={3} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider">{item.product_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 bg-ink/5 text-[10px] md:text-[7px] text-ink/60 font-medium rounded-sm">SZ {item.size || 'N/A'}</span>
                            <span className="text-[10px] md:text-[7px] text-ink/50 font-medium">×{item.quantity}</span>
                          </div>
                        </div>
                        <p className="text-xs md:text-[9px] font-mono font-medium text-ink shrink-0">
                          IDR {item.price_at_purchase.toLocaleString('id-ID')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              {selectedCount > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50">Subtotal</p>
                    <p className="text-[13px] font-display italic font-bold text-rose">
                      IDR {selectedTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Reason + Description + Video */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto minimal-scroll px-5 pb-5 space-y-4"
            >
              {/* Order Summary */}
              <div className="flex items-center gap-2 p-2.5 bg-rose/[0.04] border border-rose/10 rounded-sm">
                <RefreshCw size={11} className="text-rose shrink-0" />
                <p className="text-xs md:text-[9px] font-semibold text-rose uppercase tracking-wider">{selectedCount} Item dipilih</p>
                <p className="text-[10px] md:text-[7px] text-ink/50 ml-auto">Order: <span className="font-medium text-ink/50">{orderId}</span></p>
              </div>

              {/* Reason Selection */}
              <div>
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-2">Alasan Retur <span className="text-rose">*</span></p>
                <div className="space-y-1">
                  {RETURN_REASONS.map(r => (
                    <motion.button
                      key={r.value}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setReasonValue(r.value)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2.5 border text-left transition-all duration-200 rounded-sm',
                        reasonValue === r.value
                          ? 'border-rose/40 bg-rose/[0.03]'
                          : 'border-ink/5 hover:border-ink/15'
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors', reasonValue === r.value ? 'bg-rose border-rose' : 'border-ink/20')}>
                        {reasonValue === r.value && <Check size={8} strokeWidth={3} className="text-white" />}
                      </div>
                      <div>
                        <p className={cn('text-xs md:text-[9px] font-semibold uppercase tracking-wider', reasonValue === r.value ? 'text-rose' : 'text-ink')}>{r.label}</p>
                        <p className="text-[10px] md:text-[7px] text-ink/50">{r.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50">Deskripsi Masalah <span className="text-rose">*</span></label>
                  <span className={cn('text-[10px] md:text-[7px]', description.length < 10 ? 'text-ink/20' : 'text-emerald-500')}>{description.length}/500</span>
                </div>
                <textarea
                  value={description}
                  onChange={e => { if (e.target.value.length <= 500) setDescription(e.target.value); }}
                  rows={3}
                  placeholder="Jelaskan secara detail... Contoh: LB 52cm padahal seharusnya LB 54cm, Jahitan robekan di bagian belakang."
                  className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] focus:outline-none focus:border-rose/40 resize-none rounded-sm placeholder:text-ink/15 bg-ink/[0.01] leading-relaxed"
                />
                {description.length > 0 && description.length < 10 && (
                  <p className="text-[10px] md:text-[7px] text-rose mt-1">Minimal 10 karakter diperlukan</p>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/60 mb-2 flex items-center gap-2">
                  Bukti Video {isProduction ? <span className="text-rose">*</span> : <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-sm text-[8px] md:text-[6px]">OPSIONAL (TEST)</span>}
                </p>
                {!videoFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-ink/10 rounded-sm p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-rose/30 hover:bg-rose/[0.02] transition-all duration-200"
                  >
                    <div className="w-9 h-9 bg-ink/5 rounded-full flex items-center justify-center mb-2">
                      <Upload size={16} className="text-ink/50" />
                    </div>
                    <p className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider">Upload Video</p>
                    <p className="text-[11px] md:text-[8px] text-ink/50 mt-1">MP4 / WebM, maks 50MB</p>
                    <p className={cn("text-[10px] md:text-[7px] mt-2 font-medium", isProduction ? "text-rose/60" : "text-amber-600/70")}>
                      {isProduction ? 'WAJIB — tanpa video, retur tidak bisa diproses' : 'TEST MODE: Anda bisa melewati langkah ini'}
                    </p>
                  </div>
                ) : (
                  <div className="border border-ink/10 rounded-sm overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl || ''}
                      className="w-full aspect-video bg-black object-contain"
                      controls
                    />
                    <div className="p-2.5 bg-ink/[0.01] border-t border-ink/5 flex items-center gap-2">
                      <p className="text-xs md:text-[9px] font-medium text-ink truncate flex-1">{videoFile.name}</p>
                      <p className="text-[10px] md:text-[7px] text-ink/50">{videoDuration}s · {(videoFile.size / 1024 / 1024).toFixed(1)}MB</p>
                      <button
                        onClick={() => { setVideoFile(null); setVideoUrl(null); setVideoDuration(0); }}
                        className="w-6 h-6 flex items-center justify-center text-ink/50 hover:text-red-500 hover:bg-red-50 transition-colors rounded-sm"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoSelect(file);
                  }}
                />
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-sm p-2.5 space-y-0.5">
                  <p className="text-[10px] md:text-[7px] font-bold uppercase tracking-widest text-blue-600">Panduan Video (1-Shot, Tanpa Edit)</p>
                  {VIDEO_GUIDE.map((t, i) => (
                    <p key={i} className="text-[10px] md:text-[7px] text-blue-400 leading-relaxed flex items-start gap-1.5">
                      <span className="font-bold">{i + 1}.</span>{t}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Terms + Submit */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto minimal-scroll px-5 pb-5 space-y-4"
            >
              {/* Summary */}
              <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3 space-y-1.5">
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50">Ringkasan</p>
                {Object.entries(selectedItems).filter(([, qty]) => qty > 0).map(([itemId, qty]) => {
                  const item = items.find(i => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex items-center justify-between">
                      <span className="text-xs md:text-[9px] text-ink/60">{item.product_name} ×{qty}</span>
                      <span className="text-xs md:text-[9px] font-mono text-ink/50">IDR {(item.price_at_purchase * qty).toLocaleString('id-ID')}</span>
                    </div>
                  );
                })}
                <div className="border-t border-ink/5 pt-1.5 flex justify-between items-center">
                  <span className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50">Total</span>
                  <span className="text-[12px] font-display italic font-bold text-rose">IDR {selectedTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Policy */}
              <div className="bg-rose/[0.03] border border-rose/10 rounded-sm p-3 space-y-1.5">
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-rose/60">Kebijakan Retur</p>
                {TERMS.map((t, i) => (
                  <p key={i} className="text-[11px] md:text-[8px] text-ink/60 leading-relaxed flex items-start gap-2">
                    <span className="text-rose/40 font-bold shrink-0 mt-0.5">•</span>{t}
                  </p>
                ))}
              </div>

              {/* Terms scroll to accept */}
              <div>
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-2">Syarat & Ketentuan <span className="text-rose">*</span></p>
                <div
                  ref={termsRef}
                  onScroll={handleTermsScroll}
                  className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3 h-24 overflow-y-auto minimal-scroll"
                >
                  {TERMS.map((term, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span className="text-[11px] md:text-[8px] font-bold text-rose shrink-0 mt-0.5">{i + 1}.</span>
                      <p className="text-[11px] md:text-[8px] text-ink/50 leading-relaxed">{term}</p>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <div
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className={cn('w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0', termsAccepted ? 'bg-rose border-rose' : 'border-ink/20 hover:border-rose/40')}
                  >
                    {termsAccepted && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <p className={cn('text-[11px] md:text-[8px]', termsAccepted ? 'text-ink/60' : 'text-ink/50')}>
                    Saya telah membaca dan menyetujui syarat & ketentuan retur
                  </p>
                </label>
                {!termsScrolled && (
                  <p className="text-[10px] md:text-[7px] text-rose/60 mt-1 italic">Scroll ke bawah untuk enable tombol submit</p>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-sm">
                    <AlertCircle size={12} className="text-red-500 shrink-0" />
                    <p className="text-xs md:text-[9px] text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="px-5 py-4 border-t border-ink/5 flex items-center justify-between gap-3 shrink-0 bg-ink/[0.01]">
          <div className="flex-1 flex justify-start">
            {step > 1 && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-xs md:text-[10px] font-medium uppercase tracking-wider text-ink/50 hover:text-ink transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft size={12} /> Back
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs md:text-[10px] font-medium uppercase tracking-wider text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors rounded-sm">Batal</button>
            {step === 1 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={cn('px-5 py-2 text-xs md:text-[10px] font-semibold uppercase tracking-wider text-white rounded-sm transition-colors flex items-center gap-2', canProceedStep1 ? 'bg-rose hover:bg-rose/90' : 'bg-ink/20 text-ink/50 cursor-not-allowed')}
              >
                Lanjut <ChevronRight size={12} />
              </motion.button>
            ) : step === 2 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className={cn('px-5 py-2 text-xs md:text-[10px] font-semibold uppercase tracking-wider text-white rounded-sm transition-colors flex items-center gap-2', canProceedStep2 ? 'bg-rose hover:bg-rose/90' : 'bg-ink/20 text-ink/50 cursor-not-allowed')}
              >
                Lanjut <ChevronRight size={12} />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!canProceedStep3 || isSubmitting}
                className={cn('px-5 py-2 text-xs md:text-[10px] font-semibold uppercase tracking-wider text-white rounded-sm transition-colors flex items-center gap-2', !isSubmitting && canProceedStep3 ? 'bg-rose hover:bg-rose/90' : 'bg-ink/20 text-ink/50 cursor-not-allowed')}
              >
                {isSubmitting ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...</>
                ) : (
                  <><RefreshCw size={10} /> Ajukan Sekarang</>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}