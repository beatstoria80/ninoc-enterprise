import { useMemo } from 'react';
import { Product } from '@/types/shop';
import { VariantImageResolver } from '@/lib/domain/VariantImageResolver';

interface UseProductMetadataProps {
  product: Product | null | undefined;
  effectiveColor: string | null;
  dictLocale: string;
  activeImageIndex: number;
  hasSizes: boolean;
  effectiveSize: string | null;
}

export function useProductMetadata({
  product,
  effectiveColor,
  dictLocale,
  activeImageIndex,
  hasSizes,
  effectiveSize
}: UseProductMetadataProps) {
  const isPants = useMemo(() => product?.category?.toLowerCase() === 'celana', [product]);

  const isFnBCat = useMemo(() => {
    const cat = (product?.category || '').toLowerCase();
    return ['coffee', 'pastry', 'rtd', 'snack', 'beverage', 'pantry'].some(k => cat.includes(k));
  }, [product]);

  const isObjectsCat = useMemo(() => {
    const cat = (product?.category || '').toLowerCase();
    return !isFnBCat && ['home', 'kitchen', 'utilities', 'ceramics', 'objects', 'collectibles'].some(k => cat.includes(k));
  }, [product, isFnBCat]);

  const displaySpecs = useMemo(() => {
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    return safeSpecs.filter((s: any) => {
      if (!s?.label || typeof s.label !== 'string') return false;
      const lbl = s.label.trim();
      if (/^color(image|p10|p11|p12|p13|p14|p15|p1|p2|p3|p4|p5|p6|p7|p8|p9|desc|imagedesc|p10desc|p11desc|p12desc|p13desc|p14desc|p15desc|p1desc|p2desc|p3desc|p4desc|p5desc|p6desc|p7desc|p8desc|p9desc)\s*:/i.test(lbl)) return false;
      if (/^(extraimage|extraimagedesc|imagedesc|deskripsi_gambar)_/i.test(lbl)) return false;
      if (/^globalp([5-9]|1[0-5])$/i.test(lbl)) return false;
      return true;
    });
  }, [product]);

  const displayMeasurements = useMemo(() => {
    const safeMeasurements = Array.isArray(product?.measurements) ? product.measurements : [];
    return safeMeasurements.length > 0 ? safeMeasurements : [];
  }, [product]);

  const displayModelInfo = useMemo(() => product?.model_info || null, [product]);

  const colorGalleryMap = useMemo(() => {
    return VariantImageResolver.resolveGalleryMap(product);
  }, [product]);

  const colorDescMap = useMemo(() => {
    const map: Record<string, string> = {};
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    safeSpecs.forEach((spec: any) => {
      if (typeof spec?.label === 'string') {
        const match = spec.label.match(/^colordesc\s*:\s*(.+)$/i);
        if (match && spec.value) {
          map[match[1].trim().toUpperCase()] = spec.value;
        }
      }
    });
    return map;
  }, [product]);

  const colorImageDescMap = useMemo(() => {
    return VariantImageResolver.resolveImageDescMap(product);
  }, [product]);

  const images = useMemo(() => {
    if (!product) return [''];
    const safeColor = effectiveColor?.trim()?.toUpperCase();
    const activeGallery = safeColor ? colorGalleryMap[safeColor] : undefined;
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    const globalPImages = ['GlobalP5', 'GlobalP6', 'GlobalP7', 'GlobalP8', 'GlobalP9', 'GlobalP10', 'GlobalP11', 'GlobalP12', 'GlobalP13', 'GlobalP14', 'GlobalP15'].map(
      label => safeSpecs.find((s: any) => s?.label === label)?.value
    );
    
    const extraImages = safeSpecs
      .filter((s: any) => typeof s?.label === 'string' && s.label.startsWith('ExtraImage_') && s.value?.trim())
      .sort((a: any, b: any) => {
        const numA = parseInt(a.label.replace('ExtraImage_', ''), 10) || 0;
        const numB = parseInt(b.label.replace('ExtraImage_', ''), 10) || 0;
        return numA - numB;
      })
      .map((s: any) => s.value.trim());

    const defaultGallery = [
      product.image_url, product.perspective1, product.perspective2, product.perspective3, product.perspective4, ...globalPImages, ...extraImages
    ].filter((img): img is string => typeof img === 'string' && img.length > 0);

    const allVariantImages = Object.values(colorGalleryMap).flatMap(g => [
      g.main, g.p1, g.p2, g.p3, g.p4, g.p5, g.p6, g.p7, g.p8, g.p9, g.p10, g.p11, g.p12, g.p13, g.p14, g.p15
    ]).filter((img): img is string => typeof img === 'string' && img.length > 0);

    let rawImages: string[] = [];
    if (effectiveColor && activeGallery && (activeGallery.main || activeGallery.p1 || activeGallery.p2 || activeGallery.p3 || activeGallery.p4 || activeGallery.p5 || activeGallery.p6 || activeGallery.p7 || activeGallery.p8 || activeGallery.p9 || activeGallery.p10 || activeGallery.p11 || activeGallery.p12 || activeGallery.p13 || activeGallery.p14 || activeGallery.p15)) {
      const colorSpecific = [
        activeGallery.main || product.image_url || defaultGallery[0] || '', activeGallery.p1, activeGallery.p2, activeGallery.p3, activeGallery.p4, activeGallery.p5, activeGallery.p6, activeGallery.p7, activeGallery.p8, activeGallery.p9, activeGallery.p10, activeGallery.p11, activeGallery.p12, activeGallery.p13, activeGallery.p14, activeGallery.p15
      ].filter((img): img is string => typeof img === 'string' && img.length > 0);

      // Append all other variant & gallery images so left thumbnails always show all photos and global cursor can swipe
      const set = new Set(colorSpecific);
      [...allVariantImages, ...defaultGallery].forEach(img => {
        if (!set.has(img)) {
          set.add(img);
          colorSpecific.push(img);
        }
      });
      rawImages = colorSpecific;
    } else {
      const combined = [...defaultGallery];
      const set = new Set(combined);
      allVariantImages.forEach(img => {
        if (!set.has(img)) {
          set.add(img);
          combined.push(img);
        }
      });
      rawImages = combined;
    }
    return rawImages.length > 0 ? rawImages : [''];
  }, [product, effectiveColor, colorGalleryMap]);

  const localizedDescription = useMemo(() => {
    return dictLocale === 'EN' && product?.description_en ? product.description_en : product?.description;
  }, [dictLocale, product]);

  const imageDescriptionItems = useMemo(() => {
    if (!product) return [];
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    
    // Build map from image URL to specific description (e.g. ColorImage/ColorDesc)
    const urlToDescMap: Record<string, string> = {};
    safeSpecs.forEach((spec: any) => {
      if (typeof spec?.label === 'string' && spec.value) {
        const matchImg = spec.label.match(/^color(image|p10|p11|p12|p13|p14|p15|p1|p2|p3|p4|p5|p6|p7|p8|p9)\s*:\s*(.+)$/i);
        if (matchImg) {
          const slot = matchImg[1].toUpperCase();
          const colorName = matchImg[2].trim().toUpperCase();
          const descSpec = safeSpecs.find((s: any) => 
            typeof s?.label === 'string' && s.label.toUpperCase() === `COLOR${slot}DESC:${colorName}`
          );
          if (descSpec?.value) {
            urlToDescMap[spec.value.trim()] = descSpec.value.trim();
          }
        }
      }
    });

    const safeColor = effectiveColor?.trim()?.toUpperCase();
    const activeGallery = safeColor ? colorGalleryMap[safeColor] : undefined;
    const activeDescGallery = safeColor ? colorImageDescMap[safeColor] : undefined;
    const variantFallbackDesc = safeColor ? colorDescMap[safeColor] : undefined;

    const getDesc = (keys: string[]) => {
      for (const key of keys) {
        const found = safeSpecs.find((s: any) => s?.label && s.label.toLowerCase() === key.toLowerCase());
        if (found && found.value?.trim()) return found.value.trim();
      }
      return undefined;
    };

    return images.map((url, idx) => {
      const descFromUrl = urlToDescMap[url];
      
      const matchedEntry = Object.entries(colorGalleryMap).find(([_, g]) => {
        return [g.main, g.p1, g.p2, g.p3, g.p4, g.p5, g.p6, g.p7, g.p8, g.p9, g.p10, g.p11, g.p12, g.p13, g.p14, g.p15].includes(url);
      });
      const imgColorName = matchedEntry ? matchedEntry[0] : safeColor;
      const imgColorDesc = imgColorName ? colorDescMap[imgColorName.toUpperCase()] : variantFallbackDesc;
      const imgDescGallery = imgColorName ? colorImageDescMap[imgColorName.toUpperCase()] : activeDescGallery;

      const descFromSlot =
        idx === 0 ? (imgDescGallery?.main || imgColorDesc || getDesc(['imagedesc_main', 'imagedesc_0', 'deskripsi_gambar_0'])) :
        idx === 1 ? (imgDescGallery?.p1 || imgColorDesc || getDesc(['imagedesc_p1', 'imagedesc_1', 'deskripsi_gambar_1'])) :
        idx === 2 ? (imgDescGallery?.p2 || imgColorDesc || getDesc(['imagedesc_p2', 'imagedesc_2', 'deskripsi_gambar_2'])) :
        idx === 3 ? (imgDescGallery?.p3 || imgColorDesc || getDesc(['imagedesc_p3', 'imagedesc_3', 'deskripsi_gambar_3'])) :
        idx === 4 ? (imgDescGallery?.p4 || imgColorDesc || getDesc(['imagedesc_p4', 'imagedesc_4', 'deskripsi_gambar_4'])) :
        idx === 5 ? (imgDescGallery?.p5 || imgColorDesc || getDesc(['imagedesc_p5', 'imagedesc_5', 'deskripsi_gambar_5'])) :
        imgColorDesc;

      return {
        url,
        desc: descFromUrl || descFromSlot
      };
    });
  }, [product, images, effectiveColor, colorGalleryMap, colorImageDescMap, colorDescMap]);

  const currentImageDesc = useMemo(() => {
    if (!product || !images || images.length === 0) return null;
    const currentUrl = images[activeImageIndex];
    if (!currentUrl) return null;

    // 1. Match by URL first
    const matchByUrl = imageDescriptionItems.find(item => item.url && item.url === currentUrl && item.desc);
    if (matchByUrl?.desc) return matchByUrl.desc;

    // 2. Fallback match by index
    const matchByIndex = imageDescriptionItems[activeImageIndex]?.desc;
    if (matchByIndex) return matchByIndex;

    // 3. Fallback match by colorDescMap for active color if available
    const matchedEntry = Object.entries(colorGalleryMap).find(([_, g]) => {
      return [g.main, g.p1, g.p2, g.p3, g.p4, g.p5, g.p6, g.p7, g.p8, g.p9, g.p10, g.p11, g.p12, g.p13, g.p14, g.p15].includes(currentUrl);
    });
    const activeColorName = matchedEntry ? matchedEntry[0] : effectiveColor;
    if (activeColorName && colorDescMap[activeColorName.toUpperCase()]) {
      return colorDescMap[activeColorName.toUpperCase()];
    }

    return null;
  }, [product, images, activeImageIndex, imageDescriptionItems, colorGalleryMap, effectiveColor, colorDescMap]);

  const availableColors = useMemo(() => {
    const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
    return Array.from<string>(new Set(
      safeVariants.filter((v: any) => (!hasSizes || v?.size?.toUpperCase() === effectiveSize?.toUpperCase()) && v?.color).map((v: any) => v.color as string)
    ));
  }, [product, hasSizes, effectiveSize]);

  const selectedVariant = useMemo(() => {
    const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
    return safeVariants.find((v: any) => 
      (!hasSizes ? !v?.size : v?.size?.toUpperCase() === effectiveSize?.toUpperCase()) && 
      (!effectiveColor ? !v?.color : v?.color?.toUpperCase() === effectiveColor?.toUpperCase())
    );
  }, [product, hasSizes, effectiveSize, effectiveColor]);

  const activeImageVariantName = useMemo(() => {
    if (!product || !images || images.length === 0) return effectiveColor;
    const currentUrl = images[activeImageIndex];
    if (!currentUrl) return effectiveColor;

    const matchedEntry = Object.entries(colorGalleryMap).find(([_, g]) => {
      return [g.main, g.p1, g.p2, g.p3, g.p4, g.p5, g.p6, g.p7, g.p8, g.p9, g.p10, g.p11, g.p12, g.p13, g.p14, g.p15].includes(currentUrl);
    });

    if (matchedEntry) {
      return matchedEntry[0];
    }
    
    return effectiveColor || `${product?.variant_label || 'Series'} #${activeImageIndex + 1}`;
  }, [images, activeImageIndex, colorGalleryMap, effectiveColor, product]);

  return {
    isPants,
    isFnBCat,
    isObjectsCat,
    displaySpecs,
    displayMeasurements,
    displayModelInfo,
    colorGalleryMap,
    colorDescMap,
    colorImageDescMap,
    images,
    localizedDescription,
    imageDescriptionItems,
    currentImageDesc,
    availableColors,
    selectedVariant,
    activeImageVariantName
  };
}
