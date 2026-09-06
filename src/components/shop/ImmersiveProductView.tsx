"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Star, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/shop';
import { useHydratedCart } from '@/store/useCart';
import { useCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SafeImage from '@/components/SafeImage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImmersiveProductViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  images: string[];
  selectedSize: string;
  setSelectedSize: (s: string) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  hasSizes: boolean;
  availableSizes: string[];
  availableColors: string[];
  handleAddToCart: () => void;
  localizedDescription?: string;
  displaySpecs?: any[];
  imageDescriptionItems?: { url?: string; desc?: string }[];
  colorGalleryMap?: Record<string, { main?: string; p1?: string; p2?: string; p3?: string; p4?: string; p5?: string; p6?: string; p7?: string; p8?: string; p9?: string; p10?: string; p11?: string; p12?: string; p13?: string; p14?: string; p15?: string; }>;
  activeImageIndex?: number;
  setActiveImageIndex?: (idx: number) => void;
  colorDescMap?: Record<string, string>;
  colorImageDescMap?: Record<string, Record<string, string>>;
  onOpenReviews?: () => void;
}

export default function ImmersiveProductView({
  isOpen,
  onClose,
  product,
  images,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  quantity,
  setQuantity,
  hasSizes,
  availableSizes,
  availableColors,
  handleAddToCart,
  localizedDescription,
  displaySpecs = [],
  imageDescriptionItems = [],
  colorGalleryMap = {},
  activeImageIndex,
  setActiveImageIndex,
  colorDescMap = {},
  colorImageDescMap = {},
  onOpenReviews
}: ImmersiveProductViewProps) {
  const [activeImage, setActiveImage] = React.useState(0);
  const [isMobileCheckoutOpen, setIsMobileCheckoutOpen] = React.useState(false);
  
  // Get cart items to show global checkout quantity
  const items = useHydratedCart().items || [];
  const cartTotalItems = items.reduce((total, item) => total + item.quantity, 0);

  // Category detection for context-aware labels
  const isFnBCat = React.useMemo(() => {
    const cat = (product?.category || '').toLowerCase();
    return ['coffee', 'pastry', 'rtd', 'snack', 'beverage', 'pantry'].some(k => cat.includes(k));
  }, [product]);

  const isObjectsCat = React.useMemo(() => {
    const cat = (product?.category || '').toLowerCase();
    return !isFnBCat && ['home', 'kitchen', 'utilities', 'ceramics', 'objects', 'collectibles'].some(k => cat.includes(k));
  }, [product, isFnBCat]);

  const prevIsOpenRef = React.useRef(isOpen);

  // Sync activeImage with parent exactly once when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (typeof activeImageIndex === 'number' && activeImageIndex >= 0 && activeImageIndex < images.length) {
        requestAnimationFrame(() => {
          setActiveImage(activeImageIndex);
        });
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, activeImageIndex, images.length]);

  // Ensure activeImage is clamped safely if images array shrinks after switching color variant
  useEffect(() => {
    if (isOpen && images && images.length > 0 && activeImage >= images.length) {
      requestAnimationFrame(() => {
        setActiveImage(images.length - 1);
      });
    }
  }, [isOpen, images, activeImage]);

  // Sync selected color automatically when user swipes or drags photo in ImmersiveProductView
  useEffect(() => {
    if (!isOpen || !images || images.length === 0 || activeImage >= images.length) return;
    const currentImg = images[activeImage];
    if (!currentImg) return;

    const matchedEntry = Object.entries(colorGalleryMap).find(([_, g]) => {
      return [g.main, g.p1, g.p2, g.p3, g.p4, g.p5, g.p6, g.p7, g.p8, g.p9, g.p10, g.p11, g.p12, g.p13, g.p14, g.p15].includes(currentImg);
    });

    if (matchedEntry) {
      const [matchedColor, g] = matchedEntry;
      if (matchedColor && matchedColor !== selectedColor?.toUpperCase()) {
        const colorSpecific = [g.main || product?.image_url || '', g.p1, g.p2, g.p3, g.p4, g.p5, g.p6, g.p7, g.p8, g.p9, g.p10, g.p11, g.p12, g.p13, g.p14, g.p15].filter(
          (img): img is string => typeof img === 'string' && img.length > 0
        );
        const newIdx = colorSpecific.indexOf(currentImg);
        requestAnimationFrame(() => {
          setSelectedColor(matchedColor);
          const targetIdx = newIdx !== -1 ? newIdx : activeImage;
          if (targetIdx !== activeImage && targetIdx >= 0 && targetIdx < images.length) {
            setActiveImage(targetIdx);
          }
          if (setActiveImageIndex) setActiveImageIndex(targetIdx);
        });
      } else if (setActiveImageIndex && activeImageIndex !== activeImage) {
        requestAnimationFrame(() => {
          setActiveImageIndex(activeImage);
        });
      }
    } else if (setActiveImageIndex && activeImageIndex !== activeImage) {
      requestAnimationFrame(() => {
        setActiveImageIndex(activeImage);
      });
    }
  }, [isOpen, activeImage, images, colorGalleryMap, selectedColor, setSelectedColor, setActiveImageIndex, activeImageIndex, product?.image_url]);

  // Determine variant name for the active image
  const currentImmersiveVariantName = React.useMemo(() => {
    if (!images || images.length === 0) return selectedColor;
    const currentUrl = images[activeImage];
    if (!currentUrl) return selectedColor;

    const matchedEntry = Object.entries(colorGalleryMap).find(([_, g]) => {
      return [g.main, g.p1, g.p2, g.p3, g.p4, g.p5, g.p6, g.p7, g.p8, g.p9, g.p10, g.p11, g.p12, g.p13, g.p14, g.p15].includes(currentUrl);
    });

    if (matchedEntry) {
      return matchedEntry[0];
    }
    
    return selectedColor || `${product?.variant_label || 'Series'} #${activeImage + 1}`;
  }, [images, activeImage, colorGalleryMap, selectedColor, product]);

  // Dynamic description per active image (changes on swipe)
  const currentImmersiveDesc = React.useMemo(() => {
    if (!images || images.length === 0) return null;
    const currentUrl = images[activeImage];
    if (!currentUrl) return null;

    // 1. Match by URL first from imageDescriptionItems
    const matchByUrl = imageDescriptionItems.find(item => item.url && item.url === currentUrl && item.desc);
    if (matchByUrl?.desc) return matchByUrl.desc;

    // 2. Fallback match by index in imageDescriptionItems
    const matchByIndex = imageDescriptionItems[activeImage]?.desc;
    if (matchByIndex) return matchByIndex;

    // 3. Fallback match by colorDescMap for active image color if available
    const activeColorName = currentImmersiveVariantName || selectedColor;
    if (activeColorName && colorDescMap && colorDescMap[activeColorName.toUpperCase()]) {
      return colorDescMap[activeColorName.toUpperCase()];
    }

    return null;
  }, [images, activeImage, imageDescriptionItems, currentImmersiveVariantName, selectedColor, colorDescMap]);

  // Close on Escape key & Navigation via Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileCheckoutOpen) setIsMobileCheckoutOpen(false);
        else onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (images && activeImage < images.length - 1) {
          setActiveImage(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (activeImage > 0) {
          setActiveImage(prev => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isMobileCheckoutOpen, images, activeImage]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setIsMobileCheckoutOpen(false), 0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!product) return null;

  const currentSurcharge = hasSizes && selectedSize && SURCHARGE_SIZES.some(s => s?.toUpperCase() === selectedSize?.toUpperCase()) ? SIZE_SURCHARGE_AMOUNT : 0;
  
  // Resolve stock safely for cart limits
  const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
  const selectedVariant = safeVariants.find((v: any) => 
    (!selectedSize ? true : v?.size?.toUpperCase() === selectedSize.toUpperCase()) && 
    (!selectedColor ? true : v?.color?.toUpperCase() === selectedColor.toUpperCase())
  );
  const availableStock = selectedVariant 
    ? (typeof selectedVariant.stock_quantity === 'number' ? selectedVariant.stock_quantity : (parseInt(selectedVariant.stock_quantity) || 0))
    : (product && 'stock_quantity' in product ? (typeof (product as any).stock_quantity === 'number' ? (product as any).stock_quantity : (parseInt((product as any).stock_quantity) || 0)) : 0);

  const itemInCartQty = items
    .filter(item => item.id === product?.id && item.size === selectedSize && item.color === selectedColor)
    .reduce((sum, item) => sum + item.quantity, 0);

  const remainingStock = Math.max(0, availableStock - itemInCartQty);
  const displayQuantity = remainingStock === 0 ? 0 : Math.min(quantity, remainingStock);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          className="fixed inset-0 z-[9999] bg-white lg:bg-cr flex flex-col lg:flex-row overflow-hidden"
        >
          {/* Desktop Close Button */}
          <button 
            onClick={onClose}
            className="hidden lg:flex absolute top-6 right-6 z-[100] w-9 h-9 bg-white/10 backdrop-blur-md rounded-full items-center justify-center text-ink hover:bg-white hover:text-rose transition-colors border border-ink/10"
          >
            <X strokeWidth={1.5} size={18} />
          </button>

          {/* Mobile Top Header Navigation */}
          <div className="lg:hidden absolute top-0 left-0 right-0 z-[100] flex justify-between items-start p-4 pointer-events-none">
            <button onClick={onClose} className="pointer-events-auto w-10 h-10 flex items-center justify-center text-ink drop-shadow-sm bg-white/50 backdrop-blur-sm rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="flex flex-col items-end gap-3 pointer-events-auto mt-1 mr-1">
              <div className="flex gap-4 text-ink drop-shadow-sm bg-white/50 backdrop-blur-sm px-3 py-2 rounded-full pointer-events-auto">
                <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-search')); }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
              </div>
              <div className="px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-bold text-ink drop-shadow-sm border border-white/20 mt-1">
                {activeImage + 1}/{images.length}
              </div>
            </div>
          </div>

          {/* LEFT COLUMN: DESCRIPTION (Flexible Width on Desktop) */}
          <div className="hidden lg:flex lg:w-[320px] xl:w-[360px] 2xl:w-[400px] shrink-0 h-full bg-white flex-col justify-center pl-6 lg:pl-8 xl:pl-10 pr-6 overflow-y-auto no-scrollbar">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div>
                <div className="text-[9px] uppercase tracking-widest text-ink/40 mb-1.5">
                  {product.category || 'Apparel'}
                </div>
                <h1 className="text-lg font-display font-medium uppercase italic tracking-tighter leading-none mb-1.5">
                  {product.name}
                </h1>
                <p className="text-xs font-bold italic text-ink/80">
                  IDR {(product.price + currentSurcharge).toLocaleString('id-ID')}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`immersive-desc-${activeImage}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {currentImmersiveDesc ? (
                    <div className="p-3 bg-ink/[0.02] border-l-2 border-emerald-600 rounded-r-lg">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-700">
                          {currentImmersiveVariantName}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-ink/80 font-medium whitespace-pre-wrap">
                        {currentImmersiveDesc}
                      </p>
                    </div>
                  ) : localizedDescription ? (
                    <div className="space-y-1.5">
                      {selectedColor && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-700">
                            {selectedColor}
                          </span>
                        </div>
                      )}
                      <p className="text-xs leading-relaxed text-ink/70 whitespace-pre-wrap">
                        {localizedDescription}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* CENTER COLUMN: HUGE DRAGGABLE PHOTO (Perfectly Centered) */}
          <div className="w-full h-full lg:flex-1 shrink-0 lg:shrink bg-white relative flex flex-col lg:flex-row overflow-hidden select-none">
             {/* Photo Area - takes remaining space above bottom bar on mobile */}
             <div className="no-drag relative w-full flex-1 overflow-hidden flex items-start lg:items-center justify-center pt-24 lg:pt-0">
               <AnimatePresence>
                 {images.map((img, idx) => {
                   const offset = idx - activeImage;
                   const xOffsetStr = `${offset * 100}%`;
                   const scale = offset === 0 ? 1 : 0.85;
                   const opacity = offset === 0 ? 1 : 0.3;
                   const zIndex = 10 - Math.abs(offset);

                   return (
                     <motion.div
                       key={`${selectedColor || 'variant'}-${img}-${idx}`}
                       initial={{ opacity: 0, scale: 0.92, x: xOffsetStr }}
                       animate={{ x: xOffsetStr, scale, opacity, zIndex }}
                       exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18, ease: "easeInOut" } }}
                       transition={{ type: "spring", stiffness: 300, damping: 30 }}
                       drag={offset === 0 ? "x" : false}
                       dragConstraints={{ left: 0, right: 0 }}
                       dragElastic={0.2}
                       onDragEnd={(e, info) => {
                         if (offset !== 0) return;
                         const swipeX = info.offset.x;
                         const velocityX = info.velocity.x;
                         
                         // Drag Left -> Next Image (or wrap around to first)
                         if (swipeX < -15 || velocityX < -100) {
                           setActiveImage(prev => (prev < images.length - 1 ? prev + 1 : 0));
                         } 
                         // Drag Right -> Previous Image (or wrap around to last)
                         else if (swipeX > 15 || velocityX > 100) {
                           setActiveImage(prev => (prev > 0 ? prev - 1 : images.length - 1));
                         }
                       }}
                       className="absolute inset-0 flex items-center justify-center p-0 lg:p-6 cursor-grab active:cursor-grabbing"
                       style={{ pointerEvents: offset === 0 ? 'auto' : 'none' }}
                     >
                       <div className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center">
                         <SafeImage
                           src={img}
                           alt={`${product.name} view ${idx + 1}`}
                           className="object-contain"
                           priority={idx === 0}
                           sizes="(max-width: 1024px) 100vw, 60vw"
                         />
                       </div>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
             </div>

             {/* Mobile UI/UX Polish: Active Variant & Size Display (Below Photo) */}
             <div className="lg:hidden w-full px-4 pb-2 pt-1 flex flex-col items-center justify-center shrink-0 z-20 pointer-events-none">
               <motion.div 
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 key={`${currentImmersiveVariantName}-${selectedSize}`}
                 className="flex flex-wrap items-center justify-center gap-2"
               >
                 <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-ink/10 shadow-sm pointer-events-auto">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] uppercase font-bold tracking-[0.15em] text-ink/90">{currentImmersiveVariantName}</span>
                 </div>
                 {hasSizes && selectedSize && (
                   <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-ink/10 shadow-sm pointer-events-auto">
                     <span className="text-[9px] uppercase font-bold tracking-[0.15em] text-ink/90">SIZE {selectedSize}</span>
                   </div>
                 )}
               </motion.div>
             </div>

             {/* Mobile Action Bar: Ulasan & Bagikan — BELOW photo, horizontal, NOT overlay */}
             <div className="lg:hidden relative z-[100] flex items-center justify-center gap-4 py-1.5 bg-white border-t border-ink/5 shrink-0">
               <button 
                 onClick={() => {
                   if (onOpenReviews) onOpenReviews();
                 }}
                 className="flex items-center gap-1.5 text-ink/60 active:text-rose transition-colors px-2 py-1"
               >
                 <Star strokeWidth={1.5} size={14} />
                 <span className="text-[9px] font-bold uppercase tracking-wider">Ulasan</span>
               </button>
               <div className="w-px h-3.5 bg-ink/10" />
               <button 
                 onClick={async () => {
                   if (navigator.share) {
                     try {
                       await navigator.share({
                         title: product.name,
                         text: `Cek ${product.name} di NINOC B2B!`,
                         url: window.location.href,
                       });
                     } catch (err) {
                       console.error('Error sharing:', err);
                     }
                   } else {
                     navigator.clipboard.writeText(window.location.href);
                     alert('Link disalin ke clipboard!');
                   }
                 }}
                 className="flex items-center gap-1.5 text-ink/60 active:text-rose transition-colors px-2 py-1"
               >
                 <Share2 strokeWidth={1.5} size={14} />
                 <span className="text-[9px] font-bold uppercase tracking-wider">Bagikan</span>
               </button>
             </div>
               
             {/* Mobile White Checkout Card */}
             <div className="lg:hidden bg-white p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] flex gap-3 items-center shrink-0 pb-6 z-[100]">
               {/* Thumbnail */}
               <div className="w-12 h-12 rounded border border-gray-100 shrink-0 overflow-hidden relative bg-gray-50">
                 {images.length > 0 && <Image src={images[0]} alt="thumb" fill className="object-cover" unoptimized />}
               </div>
               
               {/* Product Info */}
               <div className="flex-1 flex flex-col justify-center overflow-hidden pr-2">
                 <span className="text-ink font-bold text-sm leading-none mb-1">
                   Rp {(product.price + currentSurcharge).toLocaleString('id-ID')}
                 </span>
                 <span className="text-[10px] text-gray-600 truncate leading-tight font-medium">
                   {product.name}
                 </span>
               </div>
               
               {/* Action Buttons */}
               <div className="flex items-center gap-1.5 shrink-0">
                 <button 
                   onClick={() => setIsMobileCheckoutOpen(true)}
                   className="w-8 h-8 rounded border border-ink text-ink bg-ink/5 flex items-center justify-center relative"
                 >
                   <ShoppingBag size={14} strokeWidth={2.5} />
                   <Plus size={10} strokeWidth={3} className="absolute bottom-1 right-0.5 bg-white rounded-full text-ink p-[1px]" />
                 </button>
                 <button 
                   onClick={() => setIsMobileCheckoutOpen(true)}
                   className="px-4 h-8 rounded bg-ink text-white text-[11px] font-bold whitespace-nowrap hover:bg-ink/90 transition-colors"
                 >
                   Beli Sekarang
                 </button>
               </div>
             </div>
          </div>

          {/* RIGHT COLUMN: ACTION PANEL (Unified details & checkout) */}
          <div className={cn(
            "lg:w-[320px] xl:w-[360px] 2xl:w-[400px] bg-white flex flex-col pl-5 pr-5 lg:pl-6 lg:pr-8 xl:pr-10 py-10 justify-end lg:justify-center shrink-0 overflow-y-auto no-scrollbar transition-transform duration-300",
            !isMobileCheckoutOpen && "translate-y-full lg:translate-y-0 hidden lg:flex",
            isMobileCheckoutOpen && "absolute bottom-0 left-0 right-0 z-[200] max-h-[85vh] rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-safe"
          )}>
            {/* Mobile Close Bottom Sheet Button */}
            {isMobileCheckoutOpen && (
              <button 
                onClick={() => setIsMobileCheckoutOpen(false)}
                className="lg:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            )}
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-md mx-auto space-y-6"
            >

              {/* SIZE SELECTION */}
              {hasSizes && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Select Size</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSizes.map(size => {
                      const isSelected = selectedSize === size;
                      const sizeVariant = safeVariants.find((v: any) => 
                        v?.size?.toUpperCase() === size?.toUpperCase() && 
                        (!selectedColor ? true : v?.color?.toUpperCase() === selectedColor?.toUpperCase())
                      );
                      const isOutOfStock = sizeVariant && typeof sizeVariant.stock_quantity === 'number' && sizeVariant.stock_quantity === 0;

                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={cn(
                            "py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden",
                            isSelected 
                              ? "bg-ink text-white" 
                              : "bg-ink/5 text-ink hover:bg-ink/10",
                            isOutOfStock && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          {size}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-40">
                              <div className="w-full h-px bg-current rotate-45 transform origin-center" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VARIANT / SERIES / COLOR SELECTION */}
              {availableColors.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">
                    {product?.variant_label
                      ? `Select ${product.variant_label}`
                      : isObjectsCat
                        ? 'Select Variant / Series'
                        : isFnBCat
                          ? 'Select Variant / Blend'
                          : 'Select Color'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => {
                      const isSelected = selectedColor === color;
                      const colorImg = colorGalleryMap[color.toUpperCase()]?.main;
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color);
                            setActiveImage(0);
                            if (setActiveImageIndex) setActiveImageIndex(0);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-300",
                            isSelected 
                              ? "bg-ink text-white" 
                              : "bg-ink/5 text-ink hover:bg-ink/10"
                          )}
                        >
                          {colorImg && (
                            <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-current">
                              <Image src={colorImg} alt={color} width={16} height={16} className="w-full h-full object-cover" unoptimized />
                            </div>
                          )}
                          <span>{color}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedColor && (isObjectsCat || isFnBCat) && (
                    <div className="flex items-center gap-2 p-2.5 bg-ink/[0.02] border border-ink/10 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">
                        {product?.variant_label || (isObjectsCat ? 'Selected Series/Model' : 'Selected Blend/Flavor')}:
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink ml-auto bg-white px-2 py-0.5 border border-ink/10">
                        {selectedColor}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* QUANTITY & STOCK */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Quantity</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-bold",
                    availableStock > 0 ? "text-emerald-500" : "text-rose"
                  )}>
                    {availableStock === 999 ? 'In Stock' : availableStock > 0 ? (itemInCartQty > 0 ? `Tersisa ${remainingStock} dari ${availableStock} Available` : `${availableStock} Available`) : 'Out of Stock'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center bg-ink/5 h-9">
                    <button 
                      onClick={() => setQuantity(Math.max(1, displayQuantity - 1))}
                      disabled={displayQuantity <= 1 || remainingStock === 0}
                      className="px-3 h-full flex items-center justify-center hover:bg-ink/10 transition-colors disabled:opacity-30"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center text-xs font-bold">{displayQuantity}</span>
                    <button 
                      onClick={() => setQuantity(displayQuantity + 1)}
                      disabled={displayQuantity >= remainingStock || remainingStock === 0}
                      className="px-3 h-full flex items-center justify-center hover:bg-ink/10 transition-colors disabled:opacity-30"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* CART INDICATOR */}
                  <button 
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('open-cart'));
                    }}
                    className="flex items-center justify-center w-9 h-9 border border-ink/10 relative shrink-0 hover:bg-ink/5 transition-colors" 
                    title="View Cart"
                  >
                    <ShoppingBag size={15} className="text-ink/80" strokeWidth={1.5} />
                    {cartTotalItems > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose text-white text-[7.5px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                        {cartTotalItems}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* ADD TO CART */}
              <button
                onClick={() => {
                  if (remainingStock <= 0) return;
                  handleAddToCart();
                  onClose();
                }}
                disabled={remainingStock === 0}
                className={cn(
                  "w-full py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500",
                  remainingStock === 0
                    ? "bg-ink/10 text-ink/40 cursor-not-allowed"
                    : "bg-ink text-white hover:bg-rose"
                )}
              >
                {remainingStock === 0 ? (availableStock === 0 ? 'Out of Stock' : `Max Stock in Cart (${itemInCartQty}/${availableStock})`) : 'Add to Cart'}
              </button>

            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
