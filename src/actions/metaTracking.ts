"use server";

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAppUrl } from '@/lib/utils';

import { type MetaTrackingStatus } from '@/types/metaTracking';

export async function getMetaTrackingStatus(): Promise<MetaTrackingStatus> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || null;
  const capiToken = process.env.META_CAPI_TOKEN || null;
  const pageId = process.env.META_PAGE_ID || null;
  const adAccountId = process.env.META_AD_ACCOUNT_ID || null;
  
  const appUrl = getAppUrl();
  const feedUrl = `${appUrl}/feed/meta.xml`;
  
  let totalProductsSynced = 0;
  
  try {
    const supabase = getSupabaseAdmin();
    // Count total products that would be exported to XML feed
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
      
    if (!error && count !== null) {
      totalProductsSynced = count;
    }
  } catch (error) {
    console.error('[MetaTracking] Error counting products for catalog:', error);
  }

  return {
    pixelId,
    capiTokenExists: !!capiToken,
    pageId,
    adAccountId,
    catalog: {
      feedUrl,
      totalProductsSynced,
      lastSynced: new Date().toISOString(), // Realtime on fetch
    },
    supportedEvents: [
      { name: 'PageView', clientSide: true, serverSide: false },
      { name: 'ViewContent', clientSide: true, serverSide: false },
      { name: 'AddToCart', clientSide: true, serverSide: true },
      { name: 'Purchase', clientSide: true, serverSide: true },
      { name: 'Search', clientSide: true, serverSide: false },
    ]
  };
}
