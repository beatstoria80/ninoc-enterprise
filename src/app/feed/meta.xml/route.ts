import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAppUrl } from '@/lib/utils';

// Disable static generation — this route must be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const appUrl = getAppUrl();
    
    // Fetch products — tanpa filter 'is_active' karena kolom tersebut mungkin tidak ada di skema DB
    const { data: products, error } = await supabase
      .from('products')
      .select('*, variants(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Meta Feed] Supabase query error:', error.message);
      // Return empty valid XML feed instead of 500 so Facebook can at least parse the response
      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>NINOC Store Catalog</title>
    <link>${appUrl}</link>
    <description>Official NINOC Product Feed for Meta Commerce</description>
  </channel>
</rss>`;
      return new NextResponse(emptyXml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    const safeProducts = products || [];
    let xmlItems = '';

    for (const product of safeProducts) {
      const link = `${appUrl}/shop/${product.slug || product.id}`;
      const price = product.price || 0;
      
      // Determine image — cek image_url (string tunggal) atau images (array)
      let imageLink = '';
      if (product.image_url && typeof product.image_url === 'string') {
        imageLink = product.image_url.startsWith('http') ? product.image_url : `${appUrl}${product.image_url}`;
      } else if (Array.isArray(product.images) && product.images.length > 0) {
        const img = product.images[0];
        imageLink = typeof img === 'string' && img.startsWith('http') ? img : `${appUrl}${img}`;
      } else {
        imageLink = `${appUrl}/og-image.png`;
      }

      // Availability — cek stock dari variants atau product.stock
      const variantStock = Array.isArray(product.variants)
        ? product.variants.reduce((sum: number, v: any) => sum + (v.stock_quantity || v.stock || 0), 0)
        : 0;
      const totalStock = product.stock || variantStock;
      const availability = totalStock > 0 ? 'in stock' : 'out of stock';

      xmlItems += `
    <item>
      <g:id>${escapeXml(String(product.id))}</g:id>
      <g:title>${escapeXml(product.name || 'Untitled')}</g:title>
      <g:description>${escapeXml(product.description || product.name || '')}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:mobile_link>${escapeXml(link)}</g:mobile_link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:brand>NINOC</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price} IDR</g:price>
    </item>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>NINOC Store Catalog</title>
    <link>${appUrl}</link>
    <description>Official NINOC Product Feed for Meta Commerce</description>${xmlItems}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[Meta Feed] Unhandled error:', err?.message || err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>NINOC Store Catalog</title>
    <link>https://ninoc.store</link>
    <description>Feed temporarily unavailable</description>
  </channel>
</rss>`;
    return new NextResponse(fallbackXml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
