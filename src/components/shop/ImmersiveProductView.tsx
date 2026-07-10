"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/shop';
import DragSlider from '@/components/DragSlider';
import { SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
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
  displaySpecs = []
}: ImmersiveProductViewProps) {
  const [activeImage, setActiveImage] = React.useState(0);
  
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
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

  const isSurchargeSize = (size: string) => SURCHARGE_SIZES.some(s => s?.toUpperCase() === size?.toUpperCase());
  const currentSurcharge = isSurchargeSize(selectedSize) ? SIZE_SURCHARGE_AMOUNT : 0;
  
  // Use product variants to check stock
  const effectiveSize = selectedSize || (hasSizes ? '' : 'ALL');
  const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
  const selectedVariant = safeVariants.find((v: any) => 
    (!hasSizes ? !v?.size : v?.size?.toUpperCase() === effectiveSize?.toUpperCase()) && 
    (!selectedColor ? !v?.color : v?.color?.toUpperCase() === selectedColor?.toUpperCase())
  );
  const availableStock = selectedVariant && typeof selectedVariant.stock_quantity === 'number' 
    ? selectedVariant.stock_quantity 
    : (typeof product.stock_quantity === 'number' ? product.stock_quantity : 999);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-cr flex flex-col lg:flex-row overflow-hidden"
        >
          {/* Close Button - Global */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white flex items-center justify-center rounded-full shadow-lg border border-ink/5 hover:bg-rose hover:text-white transition-colors"
          >
            <X strokeWidth={1.5} size={24} />
          </button>

          {/* The Left Column (Title/Desc) has been moved to the Right Action Panel for a more unified, minimal layout */}

          {/* CENTER COLUMN: HUGE DRAGGABLE PHOTO (Main Focus) */}
          <div className="flex-1 h-full bg-white relative flex items-center justify-center overflow-hidden">
             {/* Mobile Header Overlay */}
             <div className="lg:hidden absolute top-6 left-6 z-[110]">
               <h1 className="text-base font-display font-medium uppercase italic tracking-tighter mix-blend-difference text-white">
                 {product.name}
               </h1>
             </div>

             <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
               {images.map((img, idx) => {
                 const offset = idx - activeImage;
                 const yOffset = offset * 250;
                 const scale = offset === 0 ? 1 : 0.85;
                 const opacity = offset === 0 ? 1 : 0.3;
                 const zIndex = 10 - Math.abs(offset);

                 return (
                   <motion.div
                     key={idx}
                     animate={{ y: yOffset, scale, opacity, zIndex }}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     drag={offset === 0 ? "y" : false}
                     dragConstraints={{ top: 0, bottom: 0 }}
                     dragElastic={0.2}
                     onDragEnd={(e, { offset: dragOffset }) => {
                       if (offset !== 0) return;
                       const swipe = dragOffset.y;
                       if (swipe < -50 && activeImage < images.length - 1) {
                         setActiveImage(prev => prev + 1);
                       } else if (swipe > 50 && activeImage > 0) {
                         setActiveImage(prev => prev - 1);
                       }
                     }}
                     className="absolute inset-0 flex items-center justify-center p-4 lg:p-12 cursor-grab active:cursor-grabbing"
                     style={{ pointerEvents: offset === 0 ? 'auto' : 'none' }}
                   >
                     <div className="relative w-full h-full max-w-4xl mx-auto">
                       <SafeImage
                         src={img}
                         alt={`${product.name} view ${idx + 1}`}
                         className="object-contain drop-shadow-2xl"
                         priority={idx === 0}
                       />
                     </div>
                   </motion.div>
                 );
               })}
             </div>
          </div>

          {/* RIGHT COLUMN: ACTION PANEL (Unified details & checkout) */}
          <div className="w-full lg:w-[400px] h-auto lg:h-full bg-white flex flex-col p-6 lg:p-10 justify-end lg:justify-center shrink-0 overflow-y-auto no-scrollbar">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-sm mx-auto space-y-6"
            >
              {/* TITLE & PRICE (Moved from left) */}
              <div className="hidden lg:block space-y-4">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-ink/40 mb-1.5">
                    {product.category || 'Apparel'}
                  </div>
                  <h1 className="text-lg font-display font-medium uppercase italic tracking-tighter leading-tight mb-1.5">
                    {product.name}
                  </h1>
                  <p className="text-xs font-medium italic text-ink/60">
                    IDR {(product.price + currentSurcharge).toLocaleString('id-ID')}
                  </p>
                </div>
                {localizedDescription && (
                  <div 
                    className="text-[11px] leading-relaxed text-ink/70"
                    dangerouslySetInnerHTML={{ __html: localizedDescription }} 
                  />
                )}
              </div>

              {/* DIVIDER */}
              <div className="hidden lg:block w-full h-px bg-ink/5" />

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

              {/* COLOR SELECTION */}
              {availableColors.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Select Color</span>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-300",
                            isSelected 
                              ? "bg-ink text-white" 
                              : "bg-ink/5 text-ink hover:bg-ink/10"
                          )}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUANTITY & STOCK */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Quantity</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-bold",
                    availableStock > 0 ? "text-emerald-500" : "text-rose"
                  )}>
                    {availableStock === 999 ? 'In Stock' : availableStock > 0 ? `${availableStock} Available` : 'Out of Stock'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center bg-ink/5">
                    <button 
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      disabled={quantity <= 1 || availableStock === 0}
                      className="p-4 hover:bg-ink/10 transition-colors disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center text-sm font-bold">{quantity}</span>
                    <button 
                      onClick={() => quantity < availableStock && setQuantity(quantity + 1)}
                      disabled={quantity >= availableStock || availableStock === 0}
                      className="p-4 hover:bg-ink/10 transition-colors disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ADD TO CART */}
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0 || (hasSizes && !selectedSize)}
                className={cn(
                  "w-full py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500",
                  availableStock === 0 || (hasSizes && !selectedSize)
                    ? "bg-ink/10 text-ink/40 cursor-not-allowed"
                    : "bg-ink text-white hover:bg-rose"
                )}
              >
                {availableStock === 0 
                  ? 'Out of Stock' 
                  : (hasSizes && !selectedSize) 
                    ? 'Select Size' 
                    : 'Add to Cart'
                }
              </button>

            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
