import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key to bypass RLS since this is a secure server route generating a public feed
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Fetch all active products
    // Note: Assuming all products in the table are active unless there's a specific 'is_active' flag.
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        id, 
        name, 
        slug, 
        description, 
        price, 
        image_url,
        variants ( stock_quantity )
      `);

    if (error) {
      console.error('[Google Merchant Feed] Failed to fetch products:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    if (!products) {
      return new NextResponse('No products found', { status: 404 });
    }

    const domain = 'https://ninoc.store';

    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>NINOC Enterprise</title>
    <link>${domain}</link>
    <description>NINOC Enterprise Official Product Catalog</description>
`;

    for (const product of products) {
      // Calculate total stock across all variants
      let totalStock = 0;
      if (product.variants && Array.isArray(product.variants)) {
        totalStock = product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
      }

      const availability = totalStock > 0 ? 'in_stock' : 'out_of_stock';
      
      // Escape special characters for XML
      const escapeXml = (unsafe: string) => {
        return (unsafe || '').replace(/[<>&'"]/g, function (c) {
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

      const title = escapeXml(product.name);
      const description = escapeXml(product.description || product.name);
      const link = `${domain}/shop/${product.slug}`;
      const imageLink = product.image_url ? (product.image_url.startsWith('http') ? product.image_url : `${domain}${product.image_url}`) : '';
      const price = `${product.price} IDR`;

      xml += `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>NINOC</g:brand>
      <g:google_product_category>166</g:google_product_category>
    </item>`;
    }

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400', // Cache for 1 hour
      },
    });

  } catch (err) {
    console.error('[Google Merchant Feed] Error generating feed:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
