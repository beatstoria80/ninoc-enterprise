/**
 * Biteship Shipping Rates API
 * Proxy to Biteship API for real-time courier rate lookups.
 * Features in-memory TTL caching for origin warehouse lookups to eliminate DB bottlenecks.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isFnBDepartment } from '@/lib/departmentDomain';
import { getBiteshipActivationSettings } from '@/lib/settings';

// In-memory TTL cache for primary crossdock origin warehouse (5 minutes TTL)
// This is a valid Serverless optimization pattern for warm containers.
let cachedOriginHub: { postalCode: number; expiresAt: number } | null = null;

async function getOriginPostalCode(): Promise<number> {
  const now = Date.now();
  if (cachedOriginHub && cachedOriginHub.expiresAt > now) {
    return cachedOriginHub.postalCode;
  }

  let defaultOrigin = 40292; // Fallback Griya Saluyu (Bandung)
  try {
    const { data: hubData } = await supabaseAdmin
      .from('warehouses')
      .select('postal_code')
      .eq('is_crossdock_hub', true)
      .limit(1)
      .single();
    if (hubData?.postal_code) {
      defaultOrigin = parseInt(hubData.postal_code, 10);
    }
    cachedOriginHub = {
      postalCode: defaultOrigin,
      expiresAt: now + 5 * 60 * 1000,
    };
  } catch (e) {
    console.warn('[Biteship Rates] Failed to fetch Ninoc Hub from DB, using fallback.', e);
  }
  return defaultOrigin;
}

function applyGeographicRestrictions(pricing: any[], destName: string = '') {
  if (!pricing || !Array.isArray(pricing)) return pricing;
  
  const isBandungArea = destName.toLowerCase().includes('bandung') || destName.toLowerCase().includes('cimahi');
  
  if (isBandungArea) {
    return pricing;
  }
  
  // If outside Bandung, strictly strip out Grab and Gojek
  return pricing.filter((rate: any) => {
    const comp = String(rate.company || '').toLowerCase();
    return comp !== 'grab' && comp !== 'gojek';
  });
}

/**
 * Strips out heavy freight, cargo, and trucking services that are inappropriate
 * for small e-commerce parcels (fashion, accessories, F&B).
 * 
 * BLOCKED service types:
 * - JNE JTR (Trucking), JNE Super, JNE Cargo
 * - J&T Cargo, J&T Economy
 * - SiCepat Cargo, SiCepat H2H (Hub to Hub)
 * - Any service containing 'cargo', 'truck', 'freight', 'kargo'
 * 
 * ALLOWED: REG, YES, EZ, STD, Instant, Sameday, Express, etc.
 */
function applyServiceTypeFilter(pricing: any[]): any[] {
  if (!pricing || !Array.isArray(pricing)) return pricing;

  // Blocklist of service codes and keywords for heavy-freight / inappropriate services
  const BLOCKED_SERVICE_CODES = new Set([
    'jtr', 'jtr18', 'jtr250', 'jtr\u003e250',           // JNE Trucking variants
    'super', 'ss',                                    // JNE Super / Super Speed (B2B bulk)
    'eco',                                            // Economy services (too slow, B2B oriented)
  ]);

  const BLOCKED_KEYWORDS = [
    'cargo', 'kargo', 'truck', 'trucking', 'freight',
    'kontainer', 'container', 'heavy', 'hub to hub', 'h2h',
  ];

  return pricing.filter((rate: any) => {
    const serviceCode = String(rate.courier_service_code || '').toLowerCase().trim();
    const serviceName = String(rate.courier_service_name || '').toLowerCase().trim();
    const description = String(rate.description || '').toLowerCase();

    // 1. Block by exact service code match
    if (BLOCKED_SERVICE_CODES.has(serviceCode)) return false;

    // 2. Block by keyword match in service name or description
    for (const keyword of BLOCKED_KEYWORDS) {
      if (serviceCode.includes(keyword) || serviceName.includes(keyword) || description.includes(keyword)) {
        return false;
      }
    }

    // 3. Block services with extremely high prices (> Rp 500,000) as a safety net
    //    These are almost certainly B2B/freight services that slipped through
    if (rate.price && rate.price > 500000) return false;

    return true;
  });
}

function applyFnBRestrictions(pricing: any[], items: any[], destName: string = '') {
  const isFnBOrPerishable = items && Array.isArray(items) && items.some((it: any) => {
    return Boolean(it.is_perishable);
  });

  if (!isFnBOrPerishable || !pricing || !Array.isArray(pricing)) {
    return { pricing: pricing || [], is_fnb_restricted: false };
  }

  // If item is F&B or Perishable, restrict to Instant & Sameday couriers (GrabExpress, GoSend, Anteraja Sameday)
  const fnbPricing = pricing.filter((rate: any) => {
    const code = String(rate.courier_service_code || '').toLowerCase();
    const name = String(rate.courier_service_name || '').toLowerCase();
    const comp = String(rate.company || '').toLowerCase();
    return code.includes('instant') || code.includes('sameday') || name.includes('instant') || name.includes('same day') || comp === 'grab' || comp === 'gojek';
  });

  return {
    pricing: fnbPricing,
    is_fnb_restricted: true,
    fnb_notice: 'Produk Pantry / F&B (Roastery Hub) saat ini khusus pengiriman kurir Instan & Sameday (GoSend / GrabExpress wilayah Bandung & Sekitarnya) demi menjaga kualitas dan kesegaran produk.'
  };
}

export async function POST(req: Request) {
  try {
    const { destination_area_id, destination_area_name, destination_postal_code, origin_area_id, origin_postal_code, destination_latitude, destination_longitude, items, couriers, split_shipping } = await req.json();
    const apiKey = process.env.BITESHIP_API_KEY;

    // Try real Biteship API if key is configured
    if (apiKey && apiKey !== 'your_biteship_api_key_here') {
      try {
        const settings = await getBiteshipActivationSettings();
        const activeCouriersString = settings?.activated_couriers?.join(',') || 'jne,grab,gojek';

        const bodyPayload: any = {
          items: items || [],
          couriers: activeCouriersString,
        };

        let final_dest_id = destination_area_id;

        // If area name is provided, look it up in Biteship Maps API to get the area_id
        if (destination_area_name) {
          try {
            const mapRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(destination_area_name)}`, {
              headers: { 'Authorization': apiKey }
            });
            const mapData = await mapRes.json();
            if (mapData.success && mapData.areas && mapData.areas.length > 0) {
              final_dest_id = mapData.areas[0].id;
            }
          } catch (e) {
            console.error('[Biteship Maps] Failed to lookup area:', e);
          }
        }

        // Start with Both if Maps API found it
        if (final_dest_id) {
          bodyPayload.destination_area_id = final_dest_id;
        }
        if (destination_postal_code) {
          bodyPayload.destination_postal_code = destination_postal_code;
        }

        if (destination_latitude && destination_longitude) {
          bodyPayload.destination_latitude = destination_latitude;
          bodyPayload.destination_longitude = destination_longitude;
          bodyPayload.origin_latitude = settings?.warehouse_latitude || -6.9147;
          bodyPayload.origin_longitude = settings?.warehouse_longitude || 107.6098;
        }

        // Helper to fetch rates with resilient fallback
        const fetchRatesResilient = async (payload: any) => {
          let res = await fetch('https://api.biteship.com/v1/rates/couriers', {
            method: 'POST',
            headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          let json = await res.json();
          
          // Biteship mapping bug fallback: if area_id causes "No courier available" but postal code exists
          if ((!res.ok || json.success === false) && payload.destination_area_id && payload.destination_postal_code) {
            console.warn('[Biteship Rates] Fallback triggered. Area ID failed. Retrying with Postal Code only.');
            const fallbackPayload = { ...payload };
            delete fallbackPayload.destination_area_id;
            res = await fetch('https://api.biteship.com/v1/rates/couriers', {
              method: 'POST',
              headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
              body: JSON.stringify(fallbackPayload),
            });
            json = await res.json();
          }
          return { response: res, data: json };
        };

        if (split_shipping && items && items.length > 0) {
          // MULTI-WAREHOUSE / SPLIT SHIPPING LOGIC
          const defaultOrigin = await getOriginPostalCode();
          
          // Group items by origin_postal_code (fallback to defaultOrigin)
          const originGroups = items.reduce((acc: Record<string, any[]>, item: any) => {
            const code = item.origin_postal_code || defaultOrigin;
            if (!acc[code]) acc[code] = [];
            acc[code].push(item);
            return acc;
          }, {});

          const packages = await Promise.all(Object.entries(originGroups).map(async ([originCode, group]) => {
            const groupItems = group as any[];
            const payload: any = { ...bodyPayload, items: groupItems, origin_postal_code: originCode };
            
            const { response, data } = await fetchRatesResilient(payload);
            
            let finalPricing = [];
            let isFnbRestricted = false;
            let fnbNoticeStr = null;
            
            if (response.ok && data.success !== false) {
              const geoFiltered = applyGeographicRestrictions(data.pricing || [], destination_area_name);
              const serviceFiltered = applyServiceTypeFilter(geoFiltered);
              const fnbResult = applyFnBRestrictions(serviceFiltered, groupItems, destination_area_name);
              finalPricing = fnbResult.pricing;
              isFnbRestricted = fnbResult.is_fnb_restricted;
              fnbNoticeStr = fnbResult.fnb_notice;
            }
            
            // Get warehouse_id from the first item in the group that has it
            const warehouseId = groupItems.find((i: any) => i.warehouse_id)?.warehouse_id || null;

            return {
              origin_postal_code: originCode,
              warehouse_id: warehouseId,
              items: groupItems,
              pricing: finalPricing,
              is_fnb_restricted: isFnbRestricted,
              fnb_notice: fnbNoticeStr
            };
          }));

          return NextResponse.json({ success: true, packages, source: 'biteship_split' });

        } else {
          // SINGLE ORIGIN (LEGACY LOGIC)
          const defaultOrigin = await getOriginPostalCode();
          bodyPayload.origin_postal_code = origin_postal_code || defaultOrigin;

          const { response, data } = await fetchRatesResilient(bodyPayload);

          // If success, return real data
          if (response.ok && data.success !== false) {
            const geoFiltered = applyGeographicRestrictions(data.pricing || [], destination_area_name);
            const serviceFiltered = applyServiceTypeFilter(geoFiltered);
            const fnbResult = applyFnBRestrictions(serviceFiltered, items, destination_area_name);
            return NextResponse.json({ ...data, pricing: fnbResult.pricing, is_fnb_restricted: fnbResult.is_fnb_restricted, fnb_notice: fnbResult.fnb_notice, source: 'biteship' });
          }

          // If rates API error (no balance / auth issue), return clear error
          if (!response.ok || data.success === false) {
            console.warn(`[Biteship Rates] API returned error: ${JSON.stringify(data)}`);
            return NextResponse.json({ success: false, error: data.error || 'Layanan pengiriman sedang tidak tersedia. Silakan coba beberapa saat lagi.', source: 'biteship' }, { status: 503 });
          }
        }



      } catch (apiErr) {
        // Network or other error
        console.error('[Biteship Rates] API call failed:', (apiErr as Error).message);
        return NextResponse.json({ success: false, error: 'Gagal menghubungi layanan pengiriman. Silakan coba beberapa saat lagi.' }, { status: 503 });
      }
    }

    // No API key configured
    return NextResponse.json({ success: false, error: 'Layanan pengiriman belum dikonfigurasi. Hubungi admin.' }, { status: 500 });

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Rates] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan pada layanan pengiriman.' }, { status: 500 });
  }
}
