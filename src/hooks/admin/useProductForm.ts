import { useState } from 'react';
import { Product } from '@/components/admin/types';
import { compressImage } from '@/lib/utils/imageUtils';

export function useProductForm(
  dbDepartments: any[], 
  dbWarehouses: any[], 
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void,
  refreshData: () => void
) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    description_en: '',
    specifications: [] as { label: string; value: string }[],
    measurements: [] as { size: string; chest?: string; shoulder?: string; sleeve?: string; waist?: string; length: string; leg_opening?: string; thigh?: string; hip?: string }[],
    model_info: '',
    price: '',
    category: 'pakaian',
    sub_category: 'kaos',
    department_id: '',
    warehouse_id: '',
    weight_grams: 500,
    length_cm: 20,
    width_cm: 20,
    height_cm: 5,
    shelf_life_days: '',
    is_perishable: false,
    image_url: '',
    image_alt: '',
    perspective1: '',
    perspective2: '',
    perspective3: '',
    perspective4: '',
    is_featured: false,
    affiliate_eligible: false,
    price_tag: '',
    badge_text: '',
    variant_label: '',
    display_order: 999,
    variants: [] as { id: string; size: string; color: string; stock_quantity: number; sku?: string }[]
  });

  const openProductModal = (product?: Product) => {
    if (product) {
      setIsEditMode(true);
      setEditingProduct(product);
      
      const cat = (product.category || '').toLowerCase();
      const isFnBCat = ['coffee', 'pastry', 'rtd', 'snack', 'beverage', 'pantry'].some(k => cat.includes(k));
      const isObjCat = !isFnBCat && ['home', 'kitchen', 'utilities', 'ceramics', 'objects'].some(k => cat.includes(k));
      const defaultSpec = isFnBCat 
        ? { label: 'Roast Profile', value: 'Medium Roast' } 
        : isObjCat 
          ? { label: 'Material', value: 'Artisan Ceramic' } 
          : { label: 'Jenis Pakaian', value: 'Kaos' };

      setProductForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        description_en: product.description_en || '',
        specifications: product.specifications?.length ? product.specifications : [defaultSpec],
        measurements: product.measurements || [],
        model_info: product.model_info || '',
        price: (product.price ?? 0).toString(),
        category: isFnBCat 
          ? (product.category || 'coffee') 
          : isObjCat 
            ? (product.category || 'utilities') 
            : ((product.sub_category && !['pakaian', 'atasan', 'bawahan'].includes(product.sub_category)) 
                ? product.sub_category 
                : (product.category === 'pakaian' ? 'kaos' : (product.category || 'kaos'))),
        sub_category: isFnBCat 
          ? (product.sub_category || product.category || 'coffee') 
          : isObjCat 
            ? (product.sub_category || product.category || 'utilities') 
            : ((product.sub_category && !['pakaian', 'atasan', 'bawahan'].includes(product.sub_category)) 
                ? product.sub_category 
                : 'kaos'),
        department_id: product.department_id || dbDepartments?.find(d => {
          if (isFnBCat) return d.slug === 'pantry' || (d.name || '').toLowerCase().includes('pantry');
          if (isObjCat) return d.slug === 'objects' || (d.name || '').toLowerCase().includes('objects');
          return d.slug === 'apparel' || (d.name || '').toLowerCase().includes('apparel');
        })?.id || dbDepartments?.[0]?.id || '',
        warehouse_id: product.warehouse_id || dbWarehouses?.find(w => w.is_primary)?.id || dbWarehouses?.[0]?.id || '',
        weight_grams: typeof product.weight_grams === 'number' && !isNaN(product.weight_grams) ? product.weight_grams : 500,
        length_cm: typeof product.length_cm === 'number' && !isNaN(product.length_cm) ? product.length_cm : 20,
        width_cm: typeof product.width_cm === 'number' && !isNaN(product.width_cm) ? product.width_cm : 20,
        height_cm: typeof product.height_cm === 'number' && !isNaN(product.height_cm) ? product.height_cm : 5,
        shelf_life_days: product.shelf_life_days ? String(product.shelf_life_days) : '',
        is_perishable: Boolean(product.is_perishable),
        image_url: product.image_url || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorimage:'))?.value || '',
        image_alt: product.image_alt || (product.name ? `${product.name} - Official Product View` : ''),
        perspective1: product.perspective1 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp1:'))?.value || '',
        perspective2: product.perspective2 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp2:'))?.value || '',
        perspective3: product.perspective3 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp3:'))?.value || '',
        perspective4: product.perspective4 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp4:'))?.value || '',
        is_featured: Boolean(product.is_featured),
        affiliate_eligible: Boolean(product.affiliate_eligible),
        price_tag: product.price_tag || '',
        badge_text: product.badge_text || '',
        variant_label: product.variant_label || '',
        display_order: typeof product.display_order === 'number' ? product.display_order : 999,
        variants: product.variants?.length ? product.variants.map(v => {
          const parsedStock = typeof v.stock_quantity === 'number' && !isNaN(v.stock_quantity) 
            ? v.stock_quantity 
            : parseInt(String(v.stock_quantity || 0), 10);
          return {
            id: v.id || '',
            size: v.size || '',
            color: v.color || '',
            stock_quantity: isNaN(parsedStock) ? 0 : parsedStock,
            sku: v.sku || ''
          };
        }) : []
      } as any);
    } else {
      setIsEditMode(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        slug: '',
        description: '',
        description_en: '',
        specifications: [{ label: 'Fit', value: 'Standar / Regular Fit' }, { label: 'Jenis Pakaian', value: 'kaos' }],
        measurements: [],
        model_info: '',
        price: '',
        category: 'kaos',
        sub_category: 'kaos',
        department_id: dbDepartments?.find(d => d.slug === 'apparel' || (d.name || '').toLowerCase().includes('apparel'))?.id || dbDepartments?.[0]?.id || '',
        warehouse_id: dbWarehouses?.find(w => w.is_primary)?.id || dbWarehouses?.[0]?.id || '',
        weight_grams: 500,
        length_cm: 20,
        width_cm: 20,
        height_cm: 5,
        shelf_life_days: '',
        is_perishable: false,
        image_url: '',
        image_alt: '',
        perspective1: '',
        perspective2: '',
        perspective3: '',
        perspective4: '',
        is_featured: false,
        affiliate_eligible: false,
        price_tag: '',
        badge_text: '',
        variant_label: '',
        display_order: 999,
        variants: []
      } as any);
    }
    setIsProductModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleProductNameChange = (name: string) => {
    setProductForm((prev: any) => ({
      ...prev,
      name,
      slug: generateSlug(name),
      image_alt: (!prev.image_alt || prev.image_alt === prev.name || prev.image_alt.endsWith(' - Official Product View')) ? `${name} - Official Product View` : prev.image_alt
    }));
  };

  const addVariant = () => {
    setProductForm((prev: any) => ({
      ...prev,
      variants: [...prev.variants, { id: '', size: '', color: '', stock_quantity: 0 }]
    }));
  };

  const removeVariant = (index: number) => {
    setProductForm((prev: any) => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    setProductForm((prev: any) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const cleanAndParsePrice = (priceStr: string) => {
    let cleaned = priceStr.replace(/\./g, '');
    if (cleaned.includes(',')) {
      cleaned = cleaned.split(',')[0];
    }
    if (cleaned.includes('.')) {
      cleaned = cleaned.split('.')[0];
    }
    const parsed = parseInt(cleaned.replace(/[^\d-]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const saveProduct = async () => {
    try {
      const hasColors = productForm.variants.some((v: any) => v.color);
      let finalSpecs = (productForm.specifications || []).filter((s: any) => {
        if (!s || typeof s.label !== 'string') return false;
        if (typeof s.value !== 'string' || s.value.trim() === '' || s.value === 'null' || s.value === 'undefined') {
          if (s.label.toLowerCase().startsWith('colorimage:') || s.label.toLowerCase().startsWith('colorp')) {
            return false;
          }
        }
        return true;
      });

      let finalImageUrl = productForm.image_url?.trim() || null;
      let finalImageAlt = productForm.image_alt?.trim() || productForm.name || null;
      let finalP1 = productForm.perspective1?.trim() || null;
      let finalP2 = productForm.perspective2?.trim() || null;
      let finalP3 = productForm.perspective3?.trim() || null;
      let finalP4 = productForm.perspective4?.trim() || null;

      if (hasColors && finalSpecs) {
        const rawFirstColor = productForm.variants.find((v: any) => Boolean(v.color))?.color;
        const firstColor = rawFirstColor ? rawFirstColor.split(',')[0].trim() : null;
        if (firstColor) {
           const findSpecVal = (prefix: string) => {
             return finalSpecs.find((s: any) => 
               s && typeof s.label === 'string' && (
                 s.label.trim().toLowerCase() === `${prefix.toLowerCase()}:${firstColor.toLowerCase()}` ||
                 (productForm.variants.filter((v: any) => Boolean(v.color)).map((v: any) => v.color).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).length === 1 &&
                  s.label.trim().toLowerCase().startsWith(`${prefix.toLowerCase()}:`))
               )
             )?.value || null;
           };

           const specImageUrl = findSpecVal('ColorImage');
           const specP1 = findSpecVal('ColorP1');
           const specP2 = findSpecVal('ColorP2');
           const specP3 = findSpecVal('ColorP3');
           const specP4 = findSpecVal('ColorP4');

           if (specImageUrl !== null) finalImageUrl = specImageUrl;
           if (specP1 !== null) finalP1 = specP1;
           if (specP2 !== null) finalP2 = specP2;
           if (specP3 !== null) finalP3 = specP3;
           if (specP4 !== null) finalP4 = specP4;
           
           if (!finalImageUrl) {
             finalImageUrl = finalP1 || finalP2 || finalP3 || finalP4 || null;
           }

           const syncSpec = (prefix: string, val: string | null) => {
             const label = `${prefix}:${firstColor}`;
             const idx = finalSpecs.findIndex((s: any) => 
               s && typeof s.label === 'string' && (
                 s.label.trim().toLowerCase() === label.trim().toLowerCase() ||
                 (productForm.variants.filter((v: any) => Boolean(v.color)).map((v: any) => v.color).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).length === 1 &&
                  s.label.trim().toLowerCase().startsWith(`${prefix.toLowerCase()}:`))
               )
             );
             if (!val || val.trim() === '') {
               if (idx >= 0) finalSpecs.splice(idx, 1);
               return;
             }
             if (idx >= 0) finalSpecs[idx].value = val.trim();
             else finalSpecs.push({ label, value: val.trim() });
           };
           syncSpec('ColorImage', finalImageUrl);
           syncSpec('ColorP1', finalP1);
           syncSpec('ColorP2', finalP2);
           syncSpec('ColorP3', finalP3);
           syncSpec('ColorP4', finalP4);
        }
      } else if (!finalImageUrl) {
        finalImageUrl = finalP1 || finalP2 || finalP3 || finalP4 || null;
      }

      const productData = {
        name: productForm.name,
        slug: productForm.slug,
        description: productForm.description,
        description_en: productForm.description_en || null,
        specifications: finalSpecs,
        measurements: productForm.measurements.length > 0 ? productForm.measurements : null,
        model_info: productForm.model_info || null,
        price: cleanAndParsePrice(productForm.price),
        category: productForm.category,
        sub_category: (productForm as any).sub_category || productForm.category || null,
        department_id: (productForm as any).department_id || null,
        warehouse_id: (productForm as any).warehouse_id || null,
        weight_grams: parseInt(String((productForm as any).weight_grams)) || 500,
        length_cm: parseInt(String((productForm as any).length_cm)) || 20,
        width_cm: parseInt(String((productForm as any).width_cm)) || 20,
        height_cm: parseInt(String((productForm as any).height_cm)) || 5,
        shelf_life_days: (productForm as any).shelf_life_days ? parseInt(String((productForm as any).shelf_life_days)) : null,
        is_perishable: Boolean((productForm as any).is_perishable),
        image_url: finalImageUrl,
        image_alt: finalImageAlt,
        perspective1: finalP1,
        perspective2: finalP2,
        perspective3: finalP3,
        perspective4: finalP4,
        is_featured: productForm.is_featured,
        affiliate_eligible: productForm.affiliate_eligible,
        price_tag: productForm.price_tag || null,
        badge_text: productForm.badge_text || null,
        variant_label: productForm.variant_label || null,
        display_order: parseInt(String((productForm as any).display_order)) || 999,
        updated_at: new Date().toISOString()
      };

      const res = await fetch('/api/admin/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEditMode,
          editingProductId: editingProduct?.id,
          productData,
          allVariants: productForm.variants.flatMap((v: any) => {
            const colors = v.color ? v.color.split(',').map((c: string) => c.trim()).filter(Boolean) : [null];
            return colors.map((color: string | null, index: number) => {
              const variantObj: any = {
                size: v.size || null,
                color: color,
                sku: v.sku || null,
                stock_quantity: parseInt(String(v.stock_quantity)) || 0
              };
              if (v.id && index === 0) variantObj.id = v.id;
              return variantObj;
            });
          })
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product via API');

      setIsProductModalOpen(false);
      
      if (data.costingMissing) {
        showToast('Success: Product saved! ⚠️ PEMBERITAHUAN: Jangan lupa isi HPP/Costing untuk SKU ini.', 'info');
      } else {
        showToast('Success: Product saved successfully!', 'success');
      }
      
      refreshData();

      if (productForm.slug) {
        fetch('/api/admin/seo/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `https://ninoc.store/shop/${productForm.slug}`,
            action: 'URL_UPDATED'
          })
        }).catch(err => console.error('Google Indexing API error:', err));
      }
    } catch (error: any) {
      console.error('Failed to save product:', error);
      showToast('Failed to save product: ' + (error.message || JSON.stringify(error)), 'error');
    }
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingProductImage(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('files', compressedFile);
      formData.append('bucket', 'products');

      const res = await fetch('/api/admin/upload-images', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed');

      if (data.results && data.results[0]?.url) {
        setProductForm((prev: any) => {
          const newUrl = data.results[0].url;
          const firstColor = prev.variants.find((v: any) => Boolean(v.color))?.color?.split(',')[0].trim();
          const newSpecs = [...(prev.specifications || [])];
          if (firstColor && prev.variants.filter((v: any) => Boolean(v.color)).map((v: any) => v.color).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).length === 1) {
             const label = `ColorImage:${firstColor}`;
             const idx = newSpecs.findIndex((s: any) => s.label?.toLowerCase().startsWith('colorimage:'));
             if (idx >= 0) newSpecs[idx] = { label, value: newUrl };
             else newSpecs.push({ label, value: newUrl });
          }
          return {
            ...prev,
            image_url: newUrl,
            image_alt: prev.image_alt ? prev.image_alt : prev.name ? `${prev.name} - Official Product View` : 'NINOC Official Product View',
            specifications: newSpecs
          };
        });
        showToast('Image uploaded successfully!', 'success');
      }
    } catch (err: any) {
      showToast('Error uploading image: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  return {
    productForm, setProductForm,
    isEditMode, setIsEditMode,
    editingProduct, setEditingProduct,
    isProductModalOpen, setIsProductModalOpen,
    isUploadingProductImage, setIsUploadingProductImage,
    openProductModal,
    handleProductNameChange,
    addVariant,
    removeVariant,
    updateVariant,
    saveProduct,
    handleProductImageUpload
  };
}
