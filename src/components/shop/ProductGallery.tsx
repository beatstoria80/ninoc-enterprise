import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Maximize2, Star } from 'lucide-react';
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
  photoHeight?: number;
  onExpand?: () => void;
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
  photoRef,
  photoHeight,
  onExpand
}: ProductGalleryProps) {
  const { views: activeViewers } = useProductViews(product.slug);

  // Desktop vertical drag scroll state
  const desktopThumbRef = useRef<HTMLDivElement>(null);
  const isDraggingDesktop = useRef(false);
  const startYDesktop = useRef(0);
  const scrollTopDesktop = useRef(0);
  const hasDraggedDesktop = useRef(false);

  const mainBoxRef = useRef<HTMLDivElement | null>(null);
  const [internalPhotoHeight, setInternalPhotoHeight] = useState(0);

  useEffect(() => {
    const target = mainBoxRef.current || (photoRef && photoRef.current);
    if (!target) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setInternalPhotoHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [photoRef]);

  const effectiveHeight = (photoHeight && photoHeight > 0) ? photoHeight : internalPhotoHeight;

  // Mobile horizontal drag scroll state
  const mobileThumbRef = useRef<HTMLDivElement>(null);
  const isDraggingMobile = useRef(false);
  const startXMobile = useRef(0);
  const scrollLeftMobile = useRef(0);
  const hasDraggedMobile = useRef(false);

  const handleDesktopPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingDesktop.current = true;
    hasDraggedDesktop.current = false;
    startYDesktop.current = e.clientY;
    if (desktopThumbRef.current) {
      scrollTopDesktop.current = desktopThumbRef.current.scrollTop;
    }
  };

  const handleDesktopPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDesktop.current || !desktopThumbRef.current) return;
    const dy = e.clientY - startYDesktop.current;
    if (Math.abs(dy) > 5) {
      hasDraggedDesktop.current = true;
    }
    desktopThumbRef.current.scrollTop = scrollTopDesktop.current - dy;
  };

  const handleDesktopPointerUp = () => {
    isDraggingDesktop.current = false;
  };

  const handleMobilePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingMobile.current = true;
    hasDraggedMobile.current = false;
    startXMobile.current = e.clientX;
    if (mobileThumbRef.current) {
      scrollLeftMobile.current = mobileThumbRef.current.scrollLeft;
    }
  };

  const handleMobilePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingMobile.current || !mobileThumbRef.current) return;
    const dx = e.clientX - startXMobile.current;
    if (Math.abs(dx) > 5) {
      hasDraggedMobile.current = true;
    }
    mobileThumbRef.current.scrollLeft = scrollLeftMobile.current - dx;
  };

  const handleMobilePointerUp = () => {
    isDraggingMobile.current = false;
  };

  return (
    <>
      {/* DESKTOP VERTICAL THUMBNAIL LIST — Cursor Drag Swipeable */}
      <motion.div 
        variants={columnVariants} 
        className={cn(
          "hidden lg:block w-full shrink-0 select-none relative lg:self-start transition-[height] duration-200",
          effectiveHeight <= 0 && "aspect-[4/5]"
        )}
        style={{ height: effectiveHeight > 0 ? `${effectiveHeight}px` : undefined }}
      >
        <div
          ref={desktopThumbRef}
          onPointerDown={handleDesktopPointerDown}
          onPointerMove={handleDesktopPointerMove}
          onPointerUp={handleDesktopPointerUp}
          onPointerLeave={handleDesktopPointerUp}
          className="absolute inset-0 flex flex-col gap-2 overflow-y-auto no-scrollbar py-0 pr-1 cursor-grab active:cursor-grabbing"
          style={{ maskImage: 'linear-gradient(to bottom, black 0%, black 88%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 88%, transparent 100%)' }}
        >
          {images.map((img, i) => (
            <motion.button
              variants={textVariants}
              key={i}
              type="button"
              onClick={() => {
                if (hasDraggedDesktop.current) return;
                setActiveImageIndex(i);
              }}
              className={cn(
                "w-full aspect-square rounded-none overflow-hidden border-2 transition-all relative group bg-white flex-shrink-0",
                activeImageIndex === i ? "border-rose opacity-100 shadow-sm" : "border-ink/5 opacity-50 hover:opacity-100 hover:border-ink/15"
              )}
            >
              <SafeImage src={img} alt={`${product.image_alt || product.name} thumb ${i}`} className="object-contain p-1.5 pointer-events-none" sizes="100px" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={columnVariants} className="col-span-1 relative flex flex-col lg:px-0 w-full lg:self-start">
        {/* MOBILE MAIN CAROUSEL — Universal Pointer / Global Cursor Swipeable */}
        <motion.div
          className="flex lg:hidden relative w-full justify-center items-center overflow-hidden py-0 mt-0 cursor-grab active:cursor-grabbing select-none"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, { offset }) => {
            const swipe = offset.x;
            if (swipe < -40) {
              setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
            } else if (swipe > 40) {
              setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
            }
          }}
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
                <SafeImage src={img} alt={`${product.image_alt || product.name} ${idx}`} className="object-contain p-4 pointer-events-none" sizes="(max-width: 768px) 65vw, 30vw" />
              </div>
            );
          })}
        </motion.div>

        {/* MOBILE HORIZONTAL THUMBNAIL STRIP — Global Cursor Swipeable */}
        {images.length > 1 && (
          <div
            ref={mobileThumbRef}
            onPointerDown={handleMobilePointerDown}
            onPointerMove={handleMobilePointerMove}
            onPointerUp={handleMobilePointerUp}
            onPointerLeave={handleMobilePointerUp}
            className="flex lg:hidden w-full overflow-x-auto no-scrollbar gap-2 mt-2 px-1 select-none cursor-grab active:cursor-grabbing"
          >
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (hasDraggedMobile.current) return;
                  setActiveImageIndex(i);
                }}
                className={cn(
                  "w-14 h-14 shrink-0 rounded-none overflow-hidden border-2 transition-all relative bg-white",
                  activeImageIndex === i ? "border-rose opacity-100 shadow-sm" : "border-ink/10 opacity-60"
                )}
              >
                <SafeImage src={img} alt={`${product.image_alt || product.name} mobile thumb ${i}`} className="object-contain p-1 pointer-events-none" sizes="60px" />
              </button>
            ))}
          </div>
        )}

        {/* DESKTOP MAIN VIEWER — Drag Swipeable */}
        <motion.div 
          ref={(node) => {
            mainBoxRef.current = node;
            if (photoRef && typeof photoRef === 'object' && photoRef !== null) {
              (photoRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          variants={imageVariants} 
          className="no-drag hidden lg:flex w-full relative aspect-[4/5] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl items-center justify-center group cursor-pointer select-none"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, { offset }) => {
            const swipe = offset.x;
            if (swipe < -50) {
              setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
            } else if (swipe > 50) {
              setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
            }
          }}
        >
          <motion.div 
            initial={{ scale: 1.1, filter: 'blur(10px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 3, ease: [0.23, 1, 0.32, 1], delay: 0.5 }}
            className="w-full h-full relative pointer-events-none"
          >
            <SafeImage
              src={images[activeImageIndex]}
              alt={product.image_alt || product.name}
              priority
            />
          </motion.div>
          {onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="absolute top-4 left-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-100 transition-opacity border border-ink/10 hover:bg-ink hover:text-white"
              title="Immersive View"
            >
              <Maximize2 size={14} strokeWidth={1.5} />
            </button>
          )}
        </motion.div>

        {/* Realtime views & Review Badge below Main Photo */}
        <div className="w-full relative mt-3 lg:mt-4 h-[26px]">
          {activeViewers !== null && (
            <motion.div 
              variants={textVariants} 
              className="absolute top-0 left-0 lg:left-[calc(-85px-1.5rem)] xl:left-[calc(-85px-2rem)] flex items-center gap-1.5 px-2.5 py-1 bg-white border border-ink/10 rounded-full shadow-sm h-[26px] z-10 whitespace-nowrap w-max"
            >
              <Eye size={12} className="text-ink/60" />
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
