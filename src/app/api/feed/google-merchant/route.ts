import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Google Merchant Center ID: 5814201453

export async function GET() {
  try {
    // Fetch all active products with variant details
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        id, 
        name, 
        slug, 
        description, 
        price, 
        image_url,
        category,
        weight_grams,
        departments ( gpc_code, name ),
        variants ( id, size, color, stock_quantity )
      `);

    if (error) {
      console.error('[Google Merchant Feed] Failed to fetch products:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    if (!products) {
      return new NextResponse('No products found', { status: 404 });
    }

    const domain = 'https://ninoc.store';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>NINOC Enterprise</title>
    <link>${domain}</link>
    <description>NINOC Enterprise Official Product Catalog</description>
`;

    for (const product of products) {
      // Determine Google Product Category (GPC) dynamically
      let gpc = '166'; // Default: Apparel & Accessories > Clothing
      if (product.departments && typeof product.departments === 'object' && 'gpc_code' in product.departments && (product.departments as Record<string, unknown>).gpc_code) {
        gpc = String((product.departments as Record<string, unknown>).gpc_code);
      } else if (product.category) {
        const catLower = String(product.category).toLowerCase();
        if (catLower.includes('pantry') || catLower.includes('kopi') || catLower.includes('coffee') || catLower.includes('f&b') || catLower.includes('food') || catLower.includes('beverage')) {
          gpc = 'Food, Beverages & Tobacco > Beverages > Coffee';
        } else if (catLower.includes('object') || catLower.includes('goods') || catLower.includes('utilities') || catLower.includes('home')) {
          gpc = 'Home & Garden > Kitchen & Dining';
        }
      }

      const isApparel = gpc === '166' || String(gpc).toLowerCase().includes('clothing') || String(gpc).toLowerCase().includes('apparel') || String(product.category).toLowerCase() === 'pakaian' || String(product.category).toLowerCase() === 'outerwear';

      const escapeXml = (unsafe: unknown) => {
        const str = typeof unsafe === 'string' ? unsafe : String(unsafe || '');
        // Strip invalid XML 1.0 control characters
        const cleanStr = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
        return cleanStr.replace(/[<>&'"]/g, function (c) {
          switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
          }
        });
      };

      const imageLink = product.image_url ? (product.image_url.startsWith('http') ? product.image_url : `${domain}${product.image_url}`) : '';
      const formattedPrice = typeof product.price === 'number' 
        ? product.price.toFixed(2) 
        : parseFloat(product.price || '0').toFixed(2);
      const price = `${formattedPrice} IDR`;
      const weightKg = ((product.weight_grams && product.weight_grams > 0 ? product.weight_grams : 500) / 1000).toFixed(2);

      const variants = Array.isArray(product.variants) 
        ? (product.variants as Array<{ id: string; size?: string | null; color?: string | null; stock_quantity?: number }>) 
        : [];

      if (variants.length > 0) {
        for (const v of variants) {
          const variantStock = v.stock_quantity || 0;
          const availability = variantStock > 0 ? 'in_stock' : 'out_of_stock';
          const sizeAttr = v.size ? String(v.size).trim() : '';
          const colorAttr = v.color ? String(v.color).trim() : '';
          
          const variantDetails = [colorAttr, sizeAttr].filter(Boolean).join(' / ');
          const title = escapeXml(variantDetails ? `${product.name} - ${variantDetails}` : product.name);
          
          const rawDesc = product.description || product.name;
          const fullDesc = variantDetails 
            ? `${rawDesc}. Varian: ${variantDetails}. Produk resmi dari NINOC Archival Garment Studio.` 
            : `${rawDesc}. Produk resmi dari NINOC Archival Garment Studio.`;
          const description = escapeXml(fullDesc);

          const queryParams = new URLSearchParams();
          if (sizeAttr) queryParams.set('size', sizeAttr);
          if (colorAttr) queryParams.set('color', colorAttr);
          const queryString = queryParams.toString();
          const link = `${domain}/shop/${product.slug}${queryString ? `?${queryString}` : ''}`;

          const gId = escapeXml(v.id); // 36 characters UUID (within Google 50 char limit)
          const itemGroupId = escapeXml(product.id);

          xml += `
    <item>
      <g:id>${gId}</g:id>
      <g:item_group_id>${itemGroupId}</g:item_group_id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>NINOC</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn>${escapeXml(v.id)}</g:mpn>
      <g:google_product_category>${escapeXml(gpc)}</g:google_product_category>
      <g:shipping_weight>${weightKg} kg</g:shipping_weight>`;

          if (isApparel) {
            xml += `
      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
      <g:color>${escapeXml(colorAttr || 'Assorted')}</g:color>
      <g:size>${escapeXml(sizeAttr || 'All Size')}</g:size>
      <g:size_system>ID</g:size_system>
      <g:size_type>regular</g:size_type>`;
          }

          xml += `
    </item>`;
        }
      } else {
        const availability = 'in_stock';
        const title = escapeXml(product.name);
        const rawDesc = product.description || product.name;
        const description = escapeXml(`${rawDesc}. Produk resmi dari NINOC Archival Garment Studio.`);
        const link = `${domain}/shop/${product.slug}`;

        xml += `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>NINOC</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn>${escapeXml(product.id)}</g:mpn>
      <g:google_product_category>${escapeXml(gpc)}</g:google_product_category>
      <g:shipping_weight>${weightKg} kg</g:shipping_weight>`;

        if (isApparel) {
          xml += `
      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
      <g:color>Assorted</g:color>
      <g:size>All Size</g:size>
      <g:size_system>ID</g:size_system>
      <g:size_type>regular</g:size_type>`;
        }

        xml += `
    </item>`;
      }
    }

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (err) {
    console.error('[Google Merchant Feed] Error generating feed:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
