import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAppUrl } from '@/lib/utils';

// Cache the feed for 24 hours to reduce DB load (Next.js App Router syntax)
export const revalidate = 86400; 

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const appUrl = getAppUrl();
  
  // Fetch active products
  const { data: products, error } = await supabase
    .from('products')
    .select('*, variants(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !products) {
    console.error('[Meta Feed] Failed to fetch products:', error);
    return new NextResponse('<error>Failed to generate feed</error>', { 
      status: 500, 
      headers: { 'Content-Type': 'application/xml' } 
    });
  }

  let xmlItems = '';

  for (const product of products) {
    const link = `${appUrl}/shop/${product.slug || product.id}`;
    
    // In NINOC, prices might be in a different field depending on variants, 
    // but usually product.price is the base price.
    const price = product.price || 0;
    
    // Determine image link. Assume images is an array of URLs or paths.
    let imageLink = '';
    if (Array.isArray(product.images) && product.images.length > 0) {
      const img = product.images[0];
      imageLink = img.startsWith('http') ? img : `${appUrl}${img}`;
    } else {
      imageLink = `${appUrl}/og-image.png`; // Fallback image
    }

    // Availability
    const isAvailable = product.stock > 0 || (product.variants && product.variants.some((v: any) => v.stock > 0));
    const availability = isAvailable ? 'in stock' : 'out of stock';

    // Map to Meta/Google Merchant XML structure
    xmlItems += `
      <item>
        <g:id>${product.id}</g:id>
        <g:title>${escapeXml(product.name)}</g:title>
        <g:description>${escapeXml(product.description || product.name)}</g:description>
        <g:link>${escapeXml(link)}</g:link>
        <g:image_link>${escapeXml(imageLink)}</g:image_link>
        <g:brand>NINOC</g:brand>
        <g:condition>new</g:condition>
        <g:availability>${availability}</g:availability>
        <g:price>${price} IDR</g:price>
        <g:inventory>${product.stock || 0}</g:inventory>
      </item>
    `;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>NINOC Store Catalog</title>
    <link>${appUrl}</link>
    <description>Official NINOC Product Feed for Meta Commerce</description>
    ${xmlItems}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate',
    },
  });
}
