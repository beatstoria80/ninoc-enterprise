import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Eye } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { cn } from '@/lib/utils';
import { Product } from '@/types/shop';
import { ProductReview } from '@/components/admin/types';
import { useProductViews } from '@/hooks/shop/useProductViews';

interface ProductGalleryProps {
  product: Product;
  images: string[];
  reviews: ProductReview[];
  setIsReviewsDrawerOpen: (open: boolean) => void;
  activeImageIndex: number;
  setActiveImageIndex: React.Dispatch<React.SetStateAction<number>>;
  setFullscreenImage: (img: string | null) => void;
  columnVariants: any;
  imageVariants: any;
  textVariants: any;
  photoRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ProductGallery({
  product,
  images,
  reviews,
  setIsReviewsDrawerOpen,
  activeImageIndex,
  setActiveImageIndex,
  setFullscreenImage,
  columnVariants,
  imageVariants,
  textVariants,
  photoRef
}: ProductGalleryProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { views: activeViewers } = useProductViews(product.slug);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const distance = touchStart - e.changedTouches[0].clientX;
    if (distance > 40) setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    if (distance < -40) setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    setTouchStart(null);
  };

  return (
    <>
      <motion.div variants={columnVariants} className="hidden lg:block w-full shrink-0">
        <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pt-2 pb-2 pr-1 max-h-[600px]">
          {images.map((img, i) => (
            <motion.button
              variants={textVariants}
              key={i}
              onClick={() => setActiveImageIndex(i)}
              className={cn(
                "w-full aspect-square rounded-none overflow-hidden border-2 transition-all relative group bg-white flex-shrink-0",
                activeImageIndex === i ? "border-rose opacity-100 shadow-sm" : "border-ink/5 opacity-50 hover:opacity-100 hover:border-ink/15"
              )}
            >
              <SafeImage src={img} alt={product.image_alt || product.name} className="object-contain p-1.5" sizes="100px" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div ref={photoRef} variants={columnVariants} className="col-span-1 relative flex flex-col lg:px-0 w-full lg:self-start">
        <div
          className="flex lg:hidden relative w-full justify-center items-center overflow-hidden py-0 touch-pan-y mt-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-[75%] aspect-[4/5] invisible pointer-events-none" />

          {images.map((img, idx) => {
            const isActive = idx === activeImageIndex;
            const isPrev = idx === (activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1);
            const isNext = idx === (activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1);

            let positionClass = "opacity-0 scale-75 translate-x-0 z-0 pointer-events-none";
            if (isActive) positionClass = "opacity-100 scale-100 translate-x-0 z-20 shadow-xl";
            else if (isPrev) positionClass = "opacity-40 scale-[0.85] -translate-x-[65%] z-10 shadow-sm cursor-pointer";
            else if (isNext) positionClass = "opacity-40 scale-[0.85] translate-x-[65%] z-10 shadow-sm cursor-pointer";

            return (
              <div
                key={idx}
                onClick={() => {
                  if (isPrev) setActiveImageIndex(idx);
                  else if (isNext) setActiveImageIndex(idx);
                  else if (isActive) setFullscreenImage(img);
                }}
                className={cn(
                  "absolute w-[75%] aspect-[4/5] rounded-none bg-white border border-ink/5 flex items-center justify-center transition-all duration-500 ease-out",
                  positionClass
                )}
              >
                <SafeImage src={img} alt={`${product.image_alt || product.name} ${idx}`} className="object-contain p-4" sizes="(max-width: 768px) 65vw, 30vw" />
              </div>
            );
          })}
        </div>

        <motion.div ref={photoRef} variants={imageVariants} className="hidden lg:flex w-full relative aspect-[4/5] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl items-center justify-center">
          <motion.div 
            initial={{ scale: 1.1, filter: 'blur(10px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 3, ease: [0.23, 1, 0.32, 1], delay: 0.5 }}
            className="w-full h-full relative"
          >
            <SafeImage
              src={images[activeImageIndex]}
              alt={product.image_alt || product.name}
              priority
            />
          </motion.div>
        </motion.div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
              }}
              className="absolute left-0 lg:-left-6 top-1/2 -translate-y-1/2 text-ink/50 hover:text-rose transition-colors z-10"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
              }}
              className="absolute right-0 lg:-right-6 top-1/2 -translate-y-1/2 text-ink/50 hover:text-rose transition-colors z-10"
            >
              <ChevronRight size={24} strokeWidth={2} />
            </button>
          </>
        )}

        {/* Realtime views & Review Badge below Main Photo */}
        <div className="w-full relative mt-3 lg:mt-4 h-[26px]">
          {activeViewers !== null && (
            <motion.div 
              variants={textVariants} 
              className="absolute top-0 left-0 lg:left-[calc(-85px-1.5rem)] xl:left-[calc(-85px-2rem)] flex items-center gap-1.5 px-2.5 py-1 bg-white border border-ink/10 rounded-full shadow-sm h-[26px] z-10 whitespace-nowrap w-max"
            >
              <Eye size={12} className="text-ink/60" />
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] md:text-[10px] font-bold text-ink/80 uppercase tracking-widest leading-none pt-[1px]">
                  {activeViewers} Melihat
                </span>
              </div>
            </motion.div>
          )}

          <motion.button
            variants={textVariants}
            onClick={() => setIsReviewsDrawerOpen(true)}
            className="absolute top-0 right-0 flex items-center justify-center gap-1.5 px-2.5 py-1 bg-white border border-ink/10 rounded-full shadow-sm hover:bg-ink/5 transition-all group active:scale-95 h-[26px] z-10"
          >
            <div className="flex gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill={reviews.length > 0 && i < Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) ? "currentColor" : "none"} className="text-amber-500" />
              ))}
            </div>
            <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest group-hover:text-rose transition-colors leading-none pt-[1px]">
              {reviews?.length || 0} Ulasan
            </span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
