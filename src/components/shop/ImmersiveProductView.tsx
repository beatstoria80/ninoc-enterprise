"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Minus, Plus, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/shop';
import DragSlider from '@/components/DragSlider';
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
  colorImageDescMap = {}
}: ImmersiveProductViewProps) {
  const [activeImage, setActiveImage] = React.useState(0);
  
  // Get cart items to show global checkout quantity
  const items = useCart(state => state.items);
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
          className="fixed inset-0 z-[9999] bg-cr flex flex-col lg:flex-row overflow-hidden"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-ink hover:bg-white hover:text-rose transition-colors border border-ink/10"
          >
            <X strokeWidth={1.5} size={24} />
          </button>

          {/* LEFT COLUMN: DESCRIPTION (Flexible Width on Desktop) */}
          <div className="hidden lg:flex flex-1 h-full bg-white flex-col justify-center pl-12 lg:pl-24 pr-8 overflow-y-auto no-scrollbar">
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

          {/* CENTER COLUMN: HUGE DRAGGABLE PHOTO (Perfect 4:5 Aspect Ratio) */}
          <div className="w-full lg:w-auto lg:h-full lg:aspect-[4/5] shrink-0 bg-white relative flex items-center justify-center overflow-hidden">
             {/* Mobile Header Overlay */}
             <div className="lg:hidden absolute top-6 left-6 z-[110]">
               <h1 className="text-base font-display font-medium uppercase italic tracking-tighter mix-blend-difference text-white">
                 {product.name}
               </h1>
             </div>

             <div className="no-drag relative w-full h-full overflow-hidden flex items-center justify-center">
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
          <div className="w-full lg:flex-1 h-auto lg:h-full bg-white flex flex-col pl-8 pr-12 lg:pr-24 py-10 justify-end lg:justify-center shrink-0 overflow-y-auto no-scrollbar">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-sm mx-auto space-y-6"
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
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Quantity</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-bold",
                    availableStock > 0 ? "text-emerald-500" : "text-rose"
                  )}>
                    {availableStock === 999 ? 'In Stock' : availableStock > 0 ? (itemInCartQty > 0 ? `Tersisa ${remainingStock} dari ${availableStock} Available` : `${availableStock} Available`) : 'Out of Stock'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-ink/5">
                    <button 
                      onClick={() => setQuantity(Math.max(1, displayQuantity - 1))}
                      disabled={displayQuantity <= 1 || remainingStock === 0}
                      className="p-4 hover:bg-ink/10 transition-colors disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center text-sm font-bold">{displayQuantity}</span>
                    <button 
                      onClick={() => setQuantity(displayQuantity + 1)}
                      disabled={displayQuantity >= remainingStock || remainingStock === 0}
                      className="p-4 hover:bg-ink/10 transition-colors disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* CART INDICATOR */}
                  <button 
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('open-cart'));
                    }}
                    className="flex items-center justify-center w-[46px] h-[46px] border border-ink/10 relative shrink-0 hover:bg-ink/5 transition-colors" 
                    title="View Cart"
                  >
                    <ShoppingBag size={16} className="text-ink/80" strokeWidth={1.5} />
                    {cartTotalItems > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 bg-rose text-white text-[8px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
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
                  "w-full py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500",
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
