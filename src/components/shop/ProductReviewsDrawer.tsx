"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle, Clock, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface ProductReview {
  id: string;
  rating: number;
  author_name: string;
  review_text: string | null;
  created_at: string;
}

interface ProductReviewsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: ProductReview[];
  productName: string;
  productId: string;
}

export function ProductReviewsDrawer({ isOpen, onClose, reviews, productName, productId }: ProductReviewsDrawerProps) {
  const [activeView, setActiveView] = useState<'list' | 'write'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Setup form when opened
  useEffect(() => {
    if (isOpen) {
      setActiveView('list');
      setRating(0);
      setHoveredRating(0);
      setReviewText('');
      
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member';
          const masked = name.length >= 3 ? name.substring(0, 3) + '***' : name.substring(0, 1) + '***';
          setAuthorName(masked);
        } else {
          setIsLoggedIn(false);
          setAuthorName('');
        }
      };
      fetchUser();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Silakan berikan rating bintang terlebih dahulu.");
      return;
    }
    if (!authorName.trim()) {
      alert("Silakan masukkan nama Anda.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          reviewText,
          authorName
        })
      });
      
      if (!res.ok) throw new Error("Gagal mengirim ulasan");
      
      alert("Ulasan Anda berhasil dikirim! Terima kasih.");
      onClose();
      // Reload to fetch new reviews from server component
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drawer animation config (Emil's iOS-like drawer curve)
  const easeDrawer: [number, number, number, number] = [0.32, 0.72, 0, 1];

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[9998] bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: easeDrawer }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white z-[9999] flex flex-col shadow-2xl border-l border-ink/10"
          >
            {/* Header */}
            <div className="p-5 border-b border-ink/10 flex items-center justify-between bg-white shrink-0 z-10">
              <div className="flex items-center gap-3">
                {activeView === 'write' && (
                  <button 
                    onClick={() => setActiveView('list')}
                    className="p-1 -ml-1 text-ink/50 hover:text-ink transition-colors rounded-full hover:bg-ink/5 focus:outline-none"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                    {activeView === 'list' ? 'Ulasan Pelanggan' : 'Tulis Ulasan'}
                  </h2>
                  <p className="text-xs text-ink/60 mt-0.5 truncate max-w-[250px]">{productName}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-ink/50 hover:text-ink transition-colors rounded-full hover:bg-ink/5 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {activeView === 'list' ? (
              <>
                {/* Summary Rating */}
                {reviews.length > 0 && (
                  <div className="px-6 py-5 bg-ink/[0.02] border-b border-ink/5 shrink-0 flex items-center gap-4">
                    <div className="text-4xl font-display italic font-bold text-ink">{avgRating}</div>
                    <div className="flex-1">
                      <div className="flex gap-1 mb-1 text-rose">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < Math.round(Number(avgRating)) ? "currentColor" : "transparent"} 
                            className={i < Math.round(Number(avgRating)) ? "" : "text-ink/20"} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-ink/60 font-medium">Berdasarkan {reviews.length} ulasan terverifikasi</p>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {reviews.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pt-20">
                      <Star size={40} className="text-ink/20 mb-3" />
                      <p className="text-sm font-bold uppercase tracking-widest text-ink">Belum Ada Ulasan</p>
                      <p className="text-xs text-ink/60 mt-1">Jadilah yang pertama mengulas produk ini.</p>
                      <button 
                        onClick={() => setActiveView('write')} 
                        className="mt-6 px-6 py-2.5 bg-rose text-white text-xs font-bold uppercase tracking-widest rounded-none shadow-md hover:bg-ink transition-colors active:scale-[0.97]"
                      >
                        Tulis Ulasan
                      </button>
                    </div>
                  ) : (
                    reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5), ease: [0.23, 1, 0.32, 1] }}
                        className="border-b border-ink/5 pb-6 last:border-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-xs font-bold text-ink uppercase">
                              {review.author_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                                {review.author_name}
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold flex items-center gap-0.5">
                                  <CheckCircle size={10} /> Terverifikasi
                                </span>
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex gap-0.5 text-rose">
                                  {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={10} fill={j < review.rating ? "currentColor" : "transparent"} className={j < review.rating ? "" : "text-ink/20"} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-ink/40 flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-ink/80 leading-relaxed font-normal mt-3">
                            {review.review_text}
                          </p>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
                
                {/* SEO Footnote & Action (visually subtle) */}
                <div className="p-4 bg-ink/[0.02] border-t border-ink/10 shrink-0 flex flex-col gap-3">
                  {reviews.length > 0 && (
                    <button 
                      onClick={() => setActiveView('write')} 
                      className="w-full py-3 bg-ink text-white text-xs font-bold uppercase tracking-widest rounded-none shadow-md hover:bg-rose transition-colors active:scale-[0.97]"
                    >
                      Tulis Ulasan Anda
                    </button>
                  )}
                  <p className="text-[10px] text-ink/40 italic text-center">Review ratings and content are indexed for SEO.</p>
                </div>
              </>
            ) : (
              // Write Review View
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col overflow-y-auto"
              >
                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 flex flex-col">
                  
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-3">
                      Penilaian Anda <span className="text-rose">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star 
                            size={32} 
                            fill={(hoveredRating || rating) >= star ? "currentColor" : "transparent"} 
                            className={cn(
                              "transition-colors",
                              (hoveredRating || rating) >= star ? "text-amber-500" : "text-ink/20"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Nama <span className="text-rose">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={isLoggedIn}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className={cn(
                        "w-full px-4 py-3 bg-ink/[0.02] border border-ink/10 text-sm focus:outline-none focus:border-ink transition-colors",
                        isLoggedIn && "opacity-70 cursor-not-allowed"
                      )}
                    />
                    {isLoggedIn && (
                      <p className="text-[10px] text-ink/50 mt-1 italic">
                        Sebagai member, nama Anda otomatis termuat dan disamarkan untuk privasi.
                      </p>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Ulasan (Opsional)
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Bagaimana kualitas, bahan, dan kecocokan ukurannya?"
                      className="w-full flex-1 min-h-[150px] px-4 py-3 bg-ink/[0.02] border border-ink/10 text-sm focus:outline-none focus:border-ink transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-rose text-white text-xs font-bold uppercase tracking-widest rounded-none shadow-md hover:bg-ink transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      'Kirim Ulasan'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
