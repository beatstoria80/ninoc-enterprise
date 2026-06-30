"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  Video, Upload, X, Check, AlertCircle, ChevronRight, ChevronLeft,
  RefreshCw, Package, FileText, Clock, Play, Pause
} from 'lucide-react';

interface ReturFormProps {
  orderId?: string;
  isGuest?: boolean;
  onSuccess?: (returId: string) => void;
  onClose?: () => void;
  className?: string;
}

const EASING = { out: [0.23, 1, 0.32, 1] } as const;

// Alasan retur options
const RETUR_REASONS = [
  {
    value: 'rusak_cacat',
    label: 'Barang Rusak / Cacat Produksi',
    desc: 'Barang cacat, rusak, atau ada defect dari pabrik',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    value: 'salah_ukuran',
    label: 'Salah Ukuran',
    desc: 'Ukuran tidak sesuai dengan yang dipesan',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    value: 'salah_warna',
    label: 'Salah Warna / Model',
    desc: 'Warna atau model tidak sesuai pesanan',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/>
        <circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
      </svg>
    ),
  },
  {
    value: 'tidak_sesuai',
    label: 'Tidak Sesuai Deskripsi',
    desc: 'Produk tidak sesuai dengan deskripsi di website',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    value: 'lainnya',
    label: 'Lainnya',
    desc: 'Alasan lain yang tidak termasuk di atas',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

// Syarat & Ketentuan
const TERMS = [
  'Barang belum digunakan, dicuci, atau dimodifikasi',
  'Label & tag masih menempel',
  'Bukti unboxing video diambil dalam 1-shot tanpa edit, potong, atau henti',
  'Informasi yang diberikan adalah benar dan akurat',
  'NINOC berhak menolak pengajuan yang tidak memenuhi syarat',
];

export function ReturForm({ orderId: initialOrderId, isGuest = false, onSuccess, onClose, className }: ReturFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [guestEmail, setGuestEmail] = useState('');
  const [reason, setReason] = useState('');
  const [reasonLabel, setReasonLabel] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [submittedId, setSubmittedId] = useState('');
  const [error, setError] = useState('');
  const [fraudWarning, setFraudWarning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReasonSelect = (r: (typeof RETUR_REASONS)[0]) => {
    setReason(r.value);
    setReasonLabel(r.label);
    setError('');
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
    setVideoFile(file);
    setError('');
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    // Get duration
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      setVideoDuration(Math.round(video.duration));
      if (video.duration < 10) {
        setFraudWarning(true);
      } else {
        setFraudWarning(false);
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

  useEffect(() => {
    if (step === 2 && termsRef.current) {
      const { scrollHeight, clientHeight } = termsRef.current;
      if (scrollHeight <= clientHeight + 10) {
        setTermsScrolled(true);
      }
    }
  }, [step]);

  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
  const canProceedStep1 = orderId.trim().length >= 4 && reason !== '' && (!isGuest || (guestEmail.includes('@') && guestEmail.includes('.')));
  const canProceedStep2 = description.trim().length >= 10 && videoFile !== null && termsAccepted;
  const canSubmit = canProceedStep1 && canProceedStep2 && !isSubmitting;

  const handleNextStep = async () => {
    if (!canProceedStep1) {
      setError('Lengkapi Order ID dan alasan retur');
      return;
    }
    
    setIsCheckingOrder(true);
    setError('');
    
    try {
      const params = new URLSearchParams({ order_id: orderId.trim() });
      if (isGuest && guestEmail) {
        params.set('guest_email', guestEmail.trim());
      }
      
      const res = await fetch(`/api/retur/check-order?${params}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.code === 'ALREADY_EXISTS') {
          setAlreadyExists(true);
          return;
        }
        throw new Error(data.error || 'Gagal mengecek order');
      }
      
      setOrderData(data.order);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCheckingOrder(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload video
      let finalVideoUrl = '';
      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('retur_id', orderId);

        const uploadRes = await fetch('/api/retur/upload-video', {
          method: 'POST',
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Gagal upload video');
        }
        finalVideoUrl = uploadData.video_url;
      }

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Create retur request
      const payload: Record<string, unknown> = {
        order_id: orderId.trim(),
        reason,
        reason_label: reasonLabel,
        description: description.trim(),
        video_url: finalVideoUrl,
        video_duration_seconds: videoDuration,
        video_filename: videoFile?.name || '',
        return_type: returnType,
      };

      if (user) {
        payload.user_id = user.id;
      } else {
        payload.guest_email = guestEmail.trim();
      }

      const res = await fetch('/api/retur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'ALREADY_EXISTS') {
          setAlreadyExists(true);
          return;
        }
        throw new Error(data.error || 'Gagal submit retur');
      }

      setSubmittedId(data.retur_request?.id || '');
      setSubmitted(true);
      onSuccess?.(data.retur_request?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────
  if (alreadyExists) {
    return (
      <div className={cn('bg-white', className)}>
        <div className="flex flex-col items-center justify-center text-center py-6 px-3 space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-11 h-11 bg-rose/[0.03]0 rounded-full flex items-center justify-center shadow-lg"
          >
            <AlertCircle size={22} strokeWidth={2.5} className="text-white" />
          </motion.div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink">Retur Sudah Ada</p>
            <p className="text-[10px] text-ink/60 leading-snug max-w-[240px]">
              Tiket retur untuk pesanan <span className="font-semibold text-ink">{orderId}</span> sudah pernah diajukan.
            </p>
          </div>
          <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-2.5 space-y-1 w-full text-left">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70">Tindakan Selanjutnya</p>
            {[
              'Beralih ke tab "Retur Saya" atau "Status"',
              'Tim kami sedang meninjau tiket Anda',
              'Anda akan mendapat notifikasi via email/chat',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                <p className="text-[10px] text-ink/70">{s}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onSuccess?.(orderId)}
            className="w-full py-2 bg-ink text-white text-[10px] font-semibold uppercase tracking-widest rounded-sm hover:bg-ink/90 transition-colors"
          >
            Lihat Status Retur
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={cn('bg-white', className)}>
        <div className="flex flex-col items-center justify-center text-center py-6 px-3 space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <Check size={22} strokeWidth={2.5} className="text-white" />
          </motion.div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink">Retur Diajukan!</p>
            <p className="text-[10px] text-ink/60 leading-snug max-w-[240px]">
              Retur untuk pesanan <span className="font-semibold text-ink">{orderId}</span> telah kami terima.
              Tim kami akan meninjaunya dalam 1x24 jam kerja.
            </p>
          </div>
          <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-2.5 space-y-1 w-full text-left">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70">Langkah Selanjutnya</p>
            {[
              'Tim kami akan review dalam 1x24 jam kerja',
              'Anda akan mendapat notifikasi via chat',
              'Cek status di menu "Retur Saya"',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="w-3.5 h-3.5 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-px">
                  <span className="text-[8px] font-bold text-ink/60">{i + 1}</span>
                </span>
                <p className="text-[10px] text-ink/70 leading-snug">{s}</p>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full bg-ink text-white py-2 text-[10px] font-semibold uppercase tracking-widest hover:bg-rose transition-colors rounded-sm"
          >
            Tutup
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white', className)}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-rose/10 rounded-sm flex items-center justify-center">
            <RefreshCw size={10} className="text-rose" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink">Ajukan Retur</p>
            <p className="text-[9px] text-ink/60 uppercase tracking-widest">Return & Refund</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-ink/50 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-0">
              {s > 1 ? <div className={cn('h-px flex-1 transition-colors', step >= s ? 'bg-rose' : 'bg-ink/5')} /> : null}
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors shrink-0',
                step >= s ? 'bg-rose text-white' : 'bg-ink/5 text-ink/50'
              )}>
                {step > s ? <Check size={8} strokeWidth={3} /> : s}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-0.5">
          {['Order ID', 'Alasan', 'Syarat'].map((label, i) => (
            <p key={label} className={cn('text-[9px]', i + 1 <= step ? 'text-rose font-semibold' : 'text-ink/50')}>{label}</p>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Order ID + Reason */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3 space-y-3"
          >
            {/* Order ID */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-ink/60 block mb-1">
                Order ID / Nomor Pesanan <span className="text-rose">*</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="Contoh: NINOC-12345"
                className="w-full px-2.5 py-2 border border-ink/10 text-xs font-medium focus:outline-none focus:border-rose/40 rounded-sm placeholder:text-ink/15 bg-ink/[0.01]"
              />
              <p className="text-[9px] text-ink/50 mt-0.5">Cek di email atau menu &quot;Pesanan Saya&quot;</p>
            </div>

            {/* Return Type */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/60 mb-1.5">Tipe Pengajuan <span className="text-rose">*</span></p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setReturnType('refund')}
                  className={cn(
                    'p-2 border rounded-sm flex flex-col items-center gap-0.5 transition-all text-center',
                    returnType === 'refund'
                      ? 'border-rose/40 bg-rose/[0.03] text-rose shadow-sm'
                      : 'border-ink/10 bg-white text-ink/50 hover:bg-ink/[0.01]'
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Refund</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-70">Kembali Dana</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('exchange')}
                  className={cn(
                    'p-2 border rounded-sm flex flex-col items-center gap-0.5 transition-all text-center',
                    returnType === 'exchange'
                      ? 'border-rose/40 bg-rose/[0.03] text-rose shadow-sm'
                      : 'border-ink/10 bg-white text-ink/50 hover:bg-ink/[0.01]'
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Exchange</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-70">Tukar Barang</span>
                </button>
              </div>
            </div>

            {/* Guest Email */}
            {isGuest && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-ink/60 block mb-1">
                  Email <span className="text-rose">*</span>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-2.5 py-2 border border-ink/10 text-xs font-medium focus:outline-none focus:border-rose/40 rounded-sm placeholder:text-ink/15 bg-ink/[0.01]"
                />
                <p className="text-[9px] text-ink/50 mt-0.5">Kami akan hubungi Anda via email untuk update status retur</p>
              </div>
            )}

            {/* Reason */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/60 mb-1.5">Alasan Retur <span className="text-rose">*</span></p>
              <div className="space-y-1">
                {RETUR_REASONS.map((r) => {
                  const selected = reason === r.value;
                  return (
                    <motion.button
                      key={r.value}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleReasonSelect(r)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 border text-left transition-all duration-200 rounded-sm',
                        selected
                          ? 'border-rose/40 bg-rose/[0.03] shadow-sm'
                          : 'border-ink/5 hover:border-ink/15 hover:bg-ink/[0.01]'
                      )}
                    >
                      <div className={cn('w-6 h-6 rounded-sm flex items-center justify-center shrink-0 transition-colors', selected ? 'bg-rose text-white' : 'bg-ink/5 text-ink/50')}>
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[10px] font-semibold uppercase tracking-wider', selected ? 'text-rose' : 'text-ink')}>{r.label}</p>
                        <p className="text-[9px] text-ink/60 mt-px leading-snug">{r.desc}</p>
                      </div>
                      {selected && <Check size={10} className="text-rose shrink-0" strokeWidth={2.5} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Step 1 Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-100 rounded-sm">
                  <AlertCircle size={10} className="text-red-500 shrink-0" />
                  <p className="text-[10px] text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNextStep}
              disabled={!canProceedStep1 || isCheckingOrder}
              className={cn(
                'w-full py-2 text-[10px] font-semibold uppercase tracking-widest text-white rounded-sm transition-colors flex items-center justify-center gap-1.5',
                canProceedStep1 && !isCheckingOrder ? 'bg-rose hover:bg-rose/90' : 'bg-ink/20 text-ink/50 cursor-not-allowed'
              )}
            >
              {isCheckingOrder ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengecek...
                </>
              ) : (
                <>Lanjut <ChevronRight size={10} /></>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* STEP 2: Description + Video Upload */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3 space-y-3"
          >
            {/* Order Summary UI */}
            {orderData && (
              <div className="bg-ink/[0.02] border border-ink/10 rounded-sm overflow-hidden">
                <div className="px-2.5 py-1.5 bg-ink/[0.04] border-b border-ink/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package size={11} className="text-ink/60" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/80">Data Pesanan</span>
                  </div>
                  <span className="text-[9px] font-semibold text-rose bg-rose/10 px-1.5 py-px rounded-sm uppercase tracking-wider">
                    {orderData.status}
                  </span>
                </div>
                <div className="p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70 mb-0.5">Pemesan</p>
                      <p className="text-[10px] font-medium text-ink">{orderData.customer_name || 'Pelanggan'}</p>
                      {orderData.customer_email && <p className="text-[9px] text-ink/60">{orderData.customer_email}</p>}
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70 mb-0.5">Total</p>
                      <p className="text-[10px] font-semibold text-ink">Rp {(orderData.total_price || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  
                  {orderData.order_items && orderData.order_items.length > 0 && (
                    <div className="border-t border-ink/5 pt-2">
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70 mb-1">Produk ({orderData.order_items.length})</p>
                      <div className="space-y-1">
                        {orderData.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-1.5 border border-ink/5 rounded-sm">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-[10px] font-semibold text-ink truncate">{item.product_name}</p>
                              <p className="text-[9px] text-ink/60">{item.color} · {item.size} · {item.quantity}x</p>
                            </div>
                            <p className="text-[10px] font-semibold text-ink shrink-0">Rp {(item.price_at_purchase || 0).toLocaleString('id-ID')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reason Summary */}
            <div className="flex items-center gap-1.5 p-2 bg-rose/[0.04] border border-rose/10 rounded-sm">
              <RefreshCw size={10} className="text-rose shrink-0" />
              <p className="text-[10px] font-semibold text-rose uppercase tracking-wider">{reasonLabel}</p>
              <p className="text-[9px] text-ink/70 ml-auto">Order: <span className="font-medium text-ink/80">{orderId}</span></p>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-ink/60">
                  Deskripsi Masalah <span className="text-rose">*</span>
                </label>
                <span className={cn('text-[9px]', description.length < 10 ? 'text-ink/50' : 'text-emerald-500')}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={e => { if (e.target.value.length <= 500) setDescription(e.target.value); }}
                rows={3}
                placeholder="Jelaskan secara detail... Contoh: Barang yang diterima tidak sesuai ukuran."
                className="w-full px-2.5 py-2 border border-ink/10 text-xs focus:outline-none focus:border-rose/40 resize-none rounded-sm placeholder:text-ink/15 bg-ink/[0.01] leading-snug"
              />
              {description.length > 0 && description.length < 10 && (
                <p className="text-[9px] text-rose mt-0.5">Minimal 10 karakter diperlukan</p>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/60 mb-1.5 flex items-center gap-1.5">
                Bukti Unboxing Video <span className="text-rose">*</span>
              </p>
              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-ink/10 rounded-sm p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-rose/30 hover:bg-rose/[0.02] transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-ink/5 rounded-full flex items-center justify-center mb-2">
                    <Upload size={14} className="text-ink/50" />
                  </div>
                  <p className="text-xs font-bold text-ink uppercase tracking-wider">Upload Video</p>
                  <p className="text-[9px] text-ink/60 mt-0.5">MP4 / WebM, maks 50MB</p>
                  <p className="text-[9px] mt-1 font-medium text-rose/60">
                    ⚠️ WAJIB — Tanpa video, retur tidak bisa diproses
                  </p>
                </div>
              ) : (
                <div className="border border-ink/10 rounded-sm overflow-hidden">
                  {/* Video Preview */}
                  <video
                    ref={videoRef}
                    src={videoUrl || ''}
                    className="w-full aspect-video bg-black object-contain"
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoPlaying) {
                          videoRef.current.pause();
                        } else {
                          videoRef.current.play();
                        }
                        setVideoPlaying(!videoPlaying);
                      }
                    }}
                  />
                  {/* Video Controls */}
                  <div className="p-2 bg-ink/[0.01] border-t border-ink/5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoPlaying ? videoRef.current.pause() : videoRef.current.play();
                            setVideoPlaying(!videoPlaying);
                          }
                        }}
                        className="w-6 h-6 bg-ink text-white rounded-full flex items-center justify-center hover:bg-rose transition-colors"
                      >
                        {videoPlaying ? <Pause size={8} /> : <Play size={8} />}
                      </button>
                      <div className="flex-1">
                        <p className="text-[10px] font-medium text-ink truncate">{videoFile.name}</p>
                        <p className="text-[9px] text-ink/60">{videoDuration}s · {(videoFile.size / 1024 / 1024).toFixed(1)}MB</p>
                      </div>
                      {fraudWarning && (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded-sm">
                          <AlertCircle size={8} className="text-amber-500" />
                          <p className="text-[9px] text-amber-600 font-semibold">Video &lt;10s</p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setVideoFile(null);
                          setVideoUrl(null);
                          setVideoDuration(0);
                          setFraudWarning(false);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-ink/50 hover:text-red-500 hover:bg-red-50 transition-colors rounded-sm"
                      >
                        <X size={10} />
                      </button>
                    </div>
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
              <div className="mt-1.5 bg-rose/[0.03] border border-rose/10 rounded-sm p-2 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose">📋 Panduan Video (1-Shot)</p>
                {[
                  'Rekam saat membuka paket dari keadaan tertutup',
                  'Tunjukkan kondisi barang dengan jelas',
                  'WAJIB 1-shot — tanpa edit, potong, henti',
                  'Timestamp/waktu harus terlihat jelas',
                  'Minimal durasi 30 detik',
                ].map((t, i) => (
                  <p key={i} className="text-[9px] text-ink/80 leading-snug flex items-start gap-1">
                    <span className="font-bold text-rose/80">{i + 1}.</span>{t}
                  </p>
                ))}
              </div>
            </div>

            {/* Syarat & Ketentuan */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/80 mb-1.5">
                Syarat & Ketentuan <span className="text-rose">*</span>
              </p>
              <div
                ref={termsRef}
                onScroll={handleTermsScroll}
                className="bg-ink/[0.02] border border-ink/5 rounded-sm p-2 h-24 overflow-y-auto minimal-scroll"
              >
                {TERMS.map((term, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1.5">
                    <span className="text-[9px] font-bold text-rose shrink-0 mt-px">{i + 1}.</span>
                    <p className="text-[9px] text-ink/80 leading-snug">{term}</p>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                <div
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className={cn(
                    'w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all shrink-0',
                    termsAccepted
                      ? 'bg-rose border-rose'
                      : 'border-ink/20 hover:border-rose/40'
                  )}
                >
                  {termsAccepted && <Check size={8} className="text-white" strokeWidth={3} />}
                </div>
                <p className={cn('text-[10px]', termsAccepted ? 'text-ink/60' : 'text-ink/50')}>
                  Saya telah membaca dan menyetujui syarat & ketentuan di atas
                </p>
              </label>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-100 rounded-sm">
                  <AlertCircle size={10} className="text-red-500 shrink-0" />
                  <p className="text-[10px] text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(1)}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors rounded-sm flex items-center gap-0.5"
              >
                <ChevronLeft size={10} /> Back
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!canProceedStep2 || isSubmitting}
                className={cn(
                  'flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest text-white rounded-sm transition-colors flex items-center justify-center gap-1.5',
                  canProceedStep2 && !isSubmitting
                    ? 'bg-rose hover:bg-rose/90'
                    : 'bg-ink/20 text-ink/50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <RefreshCw size={9} /> Ajukan Retur
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
