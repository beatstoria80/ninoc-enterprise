export class VariantImageResolver {
  /**
   * Resolves the primary image URL for a given color from a product's specifications or variants.
   */
  static resolveColorImage(product: any, color: string | null | undefined): string | null {
    if (!product) return null;
    let colorImageUrl = product.image_url || null;
    
    if (!color) return colorImageUrl;

    const safeColor = color.trim().toUpperCase();
    const safeSpecs = Array.isArray(product.specifications) ? product.specifications : [];

    // Priority 1: Check ColorImage or Color: <url>
    const mainSpec = safeSpecs.find((spec: any) => {
      if (!spec?.label || typeof spec.label !== 'string') return false;
      const match = spec.label.match(/^color\s*(image)?\s*:\s*(.+)$/i);
      return match && match[2].trim().toUpperCase() === safeColor && spec.value?.trim();
    });

    if (mainSpec?.value?.trim()) {
      return mainSpec.value.trim();
    }

    // Priority 2: Check ColorP1: <url>
    const p1Spec = safeSpecs.find((spec: any) => {
      if (!spec?.label || typeof spec.label !== 'string') return false;
      const match = spec.label.match(/^color\s*(p1)\s*:\s*(.+)$/i);
      return match && match[2].trim().toUpperCase() === safeColor && spec.value?.trim();
    });

    if (p1Spec?.value?.trim()) {
      return p1Spec.value.trim();
    }

    // Priority 3: Check variants array
    const safeVariants = Array.isArray(product.variants) ? product.variants : [];
    const varMatch = safeVariants.find((v: any) => v.color?.trim().toUpperCase() === safeColor && v.image_url);
    if (varMatch?.image_url) {
      return varMatch.image_url;
    }

    return colorImageUrl;
  }

  /**
   * Resolves a full gallery map of all color images (main, p1 to p15).
   */
  static resolveGalleryMap(product: any): Record<string, { main?: string, p1?: string, p2?: string, p3?: string, p4?: string, p5?: string, p6?: string, p7?: string, p8?: string, p9?: string, p10?: string, p11?: string, p12?: string, p13?: string, p14?: string, p15?: string }> {
    const map: Record<string, any> = {};
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    
    safeSpecs.forEach((spec: any) => {
      if (typeof spec?.label === 'string') {
        const match = spec.label.match(/^color\s*(image|p10|p11|p12|p13|p14|p15|p1|p2|p3|p4|p5|p6|p7|p8|p9)\s*:\s*(.+)$/i);
        if (match) {
          const type = match[1].toUpperCase();
          const colorName = match[2].trim().toUpperCase();
          if (!map[colorName]) map[colorName] = {};
          
          const key = type === 'IMAGE' ? 'main' : type.toLowerCase();
          map[colorName][key] = spec?.value;
        }
      }
    });
    return map;
  }

  /**
   * Resolves the description map for color images.
   */
  static resolveImageDescMap(product: any): Record<string, Record<string, string>> {
    const map: Record<string, Record<string, string>> = {};
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    
    safeSpecs.forEach((spec: any) => {
      if (typeof spec?.label === 'string') {
        const match = spec.label.match(/^color(image|p10|p11|p12|p13|p14|p15|p1|p2|p3|p4|p5|p6|p7|p8|p9)desc\s*:\s*(.+)$/i);
        if (match && spec.value) {
          const type = match[1].toUpperCase();
          const colorName = match[2].trim().toUpperCase();
          if (!map[colorName]) map[colorName] = {};
          
          const key = type === 'IMAGE' ? 'main' : type.toLowerCase();
          map[colorName][key] = spec.value;
        }
      }
    });
    return map;
  }
}
