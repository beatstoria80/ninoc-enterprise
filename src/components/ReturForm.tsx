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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const canProceedStep1 = orderId.trim().length >= 4 && reason !== '' && (!isGuest || (guestEmail.includes('@') && guestEmail.includes('.')));
  const canProceedStep2 = description.trim().length >= 10 && videoFile !== null && termsAccepted && termsScrolled;
  const canSubmit = canProceedStep1 && canProceedStep2 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload video
      let finalVideoUrl = '';
      if (videoFile) {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || `guest-${Date.now()}`;
        const filename = `${userId}/${Date.now()}.${videoFile.name.split('.').pop()}`;
        const buffer = await videoFile.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('retur-videos')
          .upload(filename, buffer, { contentType: videoFile.type, upsert: true });
        if (uploadError) throw new Error('Gagal upload video');
        const { data: urlData } = supabase.storage
          .from('retur-videos')
          .getPublicUrl(uploadData.path);
        finalVideoUrl = urlData.publicUrl;
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
      if (!res.ok) throw new Error(data.error || 'Gagal submit retur');

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
  if (submitted) {
    return (
      <div className={cn('bg-white', className)}>
        <div className="flex flex-col items-center justify-center text-center py-12 px-6 space-y-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <Check size={28} strokeWidth={2.5} className="text-white" />
          </motion.div>
          <div className="space-y-1.5">
            <p className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink">Retur Diajukan!</p>
            <h3 className="text-[13px] font-display italic font-medium text-ink">Pengajuan Retur Berhasil</h3>
            <p className="text-xs md:text-[9px] text-ink/40 leading-relaxed max-w-[260px]">
              Retur untuk pesanan <span className="font-semibold text-ink">{orderId}</span> telah kami terima.
              Tim kami akan meninjaunya dalam 1x24 jam kerja.
            </p>
          </div>
          <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3 space-y-1.5 w-full text-left">
            <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30">Langkah Selanjutnya</p>
            {[
              'Tim kami akan review dalam 1x24 jam kerja',
              'Anda akan mendapat notifikasi via chat',
              'Cek status di menu "Retur Saya"',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] md:text-[7px] font-bold text-ink/40">{i + 1}</span>
                </span>
                <p className="text-xs md:text-[9px] text-ink/50 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full bg-ink text-white py-2.5 text-xs md:text-[9px] font-semibold uppercase tracking-widest hover:bg-rose transition-colors rounded-sm"
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
      <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-rose/10 rounded-sm flex items-center justify-center">
            <RefreshCw size={12} className="text-rose" />
          </div>
          <div>
            <p className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink">Ajukan Retur</p>
            <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest mt-0.5">Return & Refund</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-ink/30 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-0">
              {s > 1 ? <div className={cn('h-px flex-1 transition-colors', step >= s ? 'bg-rose' : 'bg-ink/5')} /> : null}
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[11px] md:text-[8px] font-bold transition-colors shrink-0',
                step >= s ? 'bg-rose text-white' : 'bg-ink/5 text-ink/30'
              )}>
                {step > s ? <Check size={9} strokeWidth={3} /> : s}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {['Order ID', 'Alasan', 'Syarat'].map((label, i) => (
            <p key={label} className={cn('text-[11px] md:text-[8px] mt-1', i + 1 <= step ? 'text-rose font-semibold' : 'text-ink/30')}>{label}</p>
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
            className="px-5 pb-5 space-y-4"
          >
            {/* Order ID */}
            <div>
              <label className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/60 block mb-1.5">
                Order ID / Nomor Pesanan <span className="text-rose">*</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="Contoh: NINOC-12345"
                className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] font-medium focus:outline-none focus:border-rose/40 rounded-sm placeholder:text-ink/15 bg-ink/[0.01]"
              />
              <p className="text-[10px] md:text-[7px] text-ink/20 mt-1">Cek di email atau menu &quot;Pesanan Saya&quot;</p>
            </div>

            {/* Guest Email */}
            {isGuest && (
              <div>
                <label className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/60 block mb-1.5">
                  Email <span className="text-rose">*</span>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] font-medium focus:outline-none focus:border-rose/40 rounded-sm placeholder:text-ink/15 bg-ink/[0.01]"
                />
                <p className="text-[10px] md:text-[7px] text-ink/20 mt-1">Kami akan hubungi Anda via email untuk update status retur</p>
              </div>
            )}

            {/* Reason */}
            <div>
              <p className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/60 mb-2">Alasan Retur <span className="text-rose">*</span></p>
              <div className="space-y-1.5">
                {RETUR_REASONS.map((r) => {
                  const selected = reason === r.value;
                  return (
                    <motion.button
                      key={r.value}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleReasonSelect(r)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 border text-left transition-all duration-200 rounded-sm',
                        selected
                          ? 'border-rose/40 bg-rose/[0.03] shadow-sm'
                          : 'border-ink/5 hover:border-ink/15 hover:bg-ink/[0.01]'
                      )}
                    >
                      <div className={cn('w-7 h-7 rounded-sm flex items-center justify-center shrink-0 transition-colors', selected ? 'bg-rose text-white' : 'bg-ink/5 text-ink/30')}>
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs md:text-[10px] font-semibold uppercase tracking-wider', selected ? 'text-rose' : 'text-ink')}>{r.label}</p>
                        <p className="text-[11px] md:text-[8px] text-ink/30 mt-0.5 leading-relaxed">{r.desc}</p>
                      </div>
                      {selected && <Check size={12} className="text-rose shrink-0" strokeWidth={2.5} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Step 1 Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-sm">
                  <AlertCircle size={12} className="text-red-500 shrink-0" />
                  <p className="text-xs md:text-[9px] text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (canProceedStep1) setStep(2); else setError('Lengkapi Order ID dan alasan retur'); }}
              className={cn(
                'w-full py-2.5 text-xs md:text-[10px] font-semibold uppercase tracking-widest text-white rounded-sm transition-colors flex items-center justify-center gap-2',
                canProceedStep1 ? 'bg-rose hover:bg-rose/90' : 'bg-ink/20 text-ink/30 cursor-not-allowed'
              )}
            >
              Lanjut <ChevronRight size={12} />
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
            className="px-5 pb-5 space-y-4"
          >
            {/* Reason Summary */}
            <div className="flex items-center gap-2 p-2.5 bg-rose/[0.04] border border-rose/10 rounded-sm">
              <RefreshCw size={11} className="text-rose shrink-0" />
              <p className="text-xs md:text-[9px] font-semibold text-rose uppercase tracking-wider">{reasonLabel}</p>
              <p className="text-[10px] md:text-[7px] text-ink/30 ml-auto">Order: <span className="font-medium text-ink/50">{orderId}</span></p>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/60">
                  Deskripsi Masalah <span className="text-rose">*</span>
                </label>
                <span className={cn('text-[10px] md:text-[7px]', description.length < 10 ? 'text-ink/20' : 'text-emerald-500')}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={e => { if (e.target.value.length <= 500) setDescription(e.target.value); }}
                rows={4}
                placeholder="Jelaskan secara detail... Contoh: Barang yang diterima tidak sesuai ukuran. LB板 52cm padahal di-checkout LB 54cm. Jahitan robekan di bagian belakang."
                className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] focus:outline-none focus:border-rose/40 resize-none rounded-sm placeholder:text-ink/15 bg-ink/[0.01] leading-relaxed"
              />
              {description.length > 0 && description.length < 10 && (
                <p className="text-[10px] md:text-[7px] text-rose mt-1">Minimal 10 karakter diperlukan</p>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <p className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/60 mb-2">
                Bukti Unboxing Video <span className="text-rose">*</span>
              </p>
              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-ink/10 rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-rose/30 hover:bg-rose/[0.02] transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-ink/5 rounded-full flex items-center justify-center mb-3">
                    <Upload size={18} className="text-ink/30" />
                  </div>
                  <p className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider">Upload Video</p>
                  <p className="text-[11px] md:text-[8px] text-ink/30 mt-1">MP4 / WebM, maks 50MB</p>
                  <p className="text-[10px] md:text-[7px] text-rose/60 mt-2 font-medium">⚠️ WAJIB — Tanpa video, retur tidak bisa diproses</p>
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
                  <div className="p-2.5 bg-ink/[0.01] border-t border-ink/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoPlaying ? videoRef.current.pause() : videoRef.current.play();
                            setVideoPlaying(!videoPlaying);
                          }
                        }}
                        className="w-7 h-7 bg-ink text-white rounded-full flex items-center justify-center hover:bg-rose transition-colors"
                      >
                        {videoPlaying ? <Pause size={10} /> : <Play size={10} />}
                      </button>
                      <div className="flex-1">
                        <p className="text-xs md:text-[9px] font-medium text-ink truncate">{videoFile.name}</p>
                        <p className="text-[10px] md:text-[7px] text-ink/30">{videoDuration}s · {(videoFile.size / 1024 / 1024).toFixed(1)}MB</p>
                      </div>
                      {fraudWarning && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-sm">
                          <AlertCircle size={10} className="text-amber-500" />
                          <p className="text-[10px] md:text-[7px] text-amber-600 font-semibold">Video &lt;10 detik</p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setVideoFile(null);
                          setVideoUrl(null);
                          setVideoDuration(0);
                          setFraudWarning(false);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-ink/30 hover:text-red-500 hover:bg-red-50 transition-colors rounded-sm"
                      >
                        <X size={12} />
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
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-sm p-2.5 space-y-1">
                <p className="text-[10px] md:text-[7px] font-bold uppercase tracking-widest text-blue-600">📋 Panduan Video Unboxing (1-Shot — Tanpa Edit)</p>
                {[
                  'Rekam saat membuka paket dari keadaan tertutup',
                  'Tunjukkan kondisi barang dengan jelas',
                  'WAJIB 1-shot — tanpa edit, potong, henti, atau sisipkan adegan',
                  'Timestamp/waktu harus terlihat jelas di rekaman',
                  'Minimal durasi 30 detik',
                ].map((t, i) => (
                  <p key={i} className="text-[10px] md:text-[7px] text-blue-400 leading-relaxed flex items-start gap-1.5">
                    <span className="font-bold">{i + 1}.</span>{t}
                  </p>
                ))}
              </div>
            </div>

            {/* Syarat & Ketentuan */}
            <div>
              <p className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/60 mb-2">
                Syarat & Ketentuan <span className="text-rose">*</span>
              </p>
              <div
                ref={termsRef}
                onScroll={handleTermsScroll}
                className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3 h-28 overflow-y-auto minimal-scroll"
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
                  className={cn(
                    'w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0',
                    termsAccepted
                      ? 'bg-rose border-rose'
                      : 'border-ink/20 hover:border-rose/40'
                  )}
                >
                  {termsAccepted && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <p className={cn('text-[11px] md:text-[8px]', termsAccepted ? 'text-ink/60' : 'text-ink/30')}>
                  Saya telah membaca dan menyetujui syarat & ketentuan di atas
                </p>
              </label>
              {!termsScrolled && (
                <p className="text-[10px] md:text-[7px] text-rose/60 mt-1 italic">← Scroll ke bawah untuk enable tombol submit</p>
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

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs md:text-[10px] font-medium uppercase tracking-wider text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors rounded-sm flex items-center gap-1"
              >
                <ChevronLeft size={12} /> Back
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!canProceedStep2 || isSubmitting}
                className={cn(
                  'flex-1 py-2.5 text-xs md:text-[10px] font-semibold uppercase tracking-widest text-white rounded-sm transition-colors flex items-center justify-center gap-2',
                  canProceedStep2 && !isSubmitting
                    ? 'bg-rose hover:bg-rose/90'
                    : 'bg-ink/20 text-ink/30 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <RefreshCw size={11} /> Ajukan Retur
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
