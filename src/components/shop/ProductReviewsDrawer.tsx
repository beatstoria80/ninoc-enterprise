"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function ProductReviewsDrawer({ isOpen, onClose, reviews, productName }: ProductReviewsDrawerProps) {
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
            className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: easeDrawer }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white z-[101] flex flex-col shadow-2xl border-l border-ink/10"
          >
            {/* Header */}
            <div className="p-5 border-b border-ink/10 flex items-center justify-between bg-white shrink-0 z-10">
              <div>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Ulasan Pelanggan</h2>
                <p className="text-xs text-ink/60 mt-0.5 truncate max-w-[250px]">{productName}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-ink/50 hover:text-ink transition-colors rounded-full hover:bg-ink/5 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

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
            
            {/* SEO Footnote (visually subtle) */}
            <div className="p-4 bg-ink/[0.02] border-t border-ink/10 text-center shrink-0">
              <p className="text-[10px] text-ink/40 italic">Review ratings and content are indexed for SEO.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
