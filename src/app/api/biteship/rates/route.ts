/**
 * Biteship Shipping Rates API
 * Proxy to Biteship API — tries real Biteship first, falls back to mock on failure.
 * Features in-memory TTL caching for origin warehouse lookups to eliminate DB bottlenecks.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isFnBDepartment } from '@/lib/departmentDomain';
import { getBiteshipActivationSettings } from '@/lib/settings';

const MOCK_RATES = {
  success: true,
  object: 'rates',
  source: 'fallback',
  pricing: [
    { id: 'rate_jne_reg', company: 'jne', courier_name: 'JNE', courier_service_name: 'REGULER', courier_service_code: 'reg', description: 'Layanan reguler JNE - 2-3 hari kerja', duration: '2-3 Days', price: 12000 },
    { id: 'rate_jne_yes', company: 'jne', courier_name: 'JNE', courier_service_name: 'YES', courier_service_code: 'yes', description: 'Layanan besok JNE - 1 hari kerja', duration: '1 Day', price: 18000 },
    { id: 'rate_grab_instant', company: 'grab', courier_name: 'GrabExpress', courier_service_name: 'Instant', courier_service_code: 'instant', description: 'Layanan GrabExpress Instant', duration: '1-3 Hours', price: 25000 },
    { id: 'rate_grab_sameday', company: 'grab', courier_name: 'GrabExpress', courier_service_name: 'Same Day', courier_service_code: 'sameday', description: 'Layanan GrabExpress Same Day', duration: '6-8 Hours', price: 15000 },
    { id: 'rate_gojek_instant', company: 'gojek', courier_name: 'GoSend', courier_service_name: 'Instant', courier_service_code: 'instant', description: 'Layanan GoSend Instant', duration: '1-3 Hours', price: 26000 },
    { id: 'rate_gojek_sameday', company: 'gojek', courier_name: 'GoSend', courier_service_name: 'Same Day', courier_service_code: 'sameday', description: 'Layanan GoSend Same Day', duration: '6-8 Hours', price: 16000 },
  ],
  available_couriers: ['jne', 'grab', 'gojek'],
};

// In-memory TTL cache for primary crossdock origin warehouse (5 minutes TTL)
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

function applyFnBRestrictions(pricing: any[], items: any[], destName: string = '') {
  const isFnBOrPerishable = items && Array.isArray(items) && items.some((it: any) => {
    return Boolean(it.is_perishable) || isFnBDepartment(it);
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
    const { destination_area_id, destination_area_name, destination_postal_code, origin_area_id, origin_postal_code, destination_latitude, destination_longitude, items, couriers } = await req.json();
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

        if (destination_postal_code) bodyPayload.destination_postal_code = destination_postal_code;
        else if (final_dest_id) bodyPayload.destination_area_id = final_dest_id;

        if (destination_latitude && destination_longitude) {
          bodyPayload.destination_latitude = destination_latitude;
          bodyPayload.destination_longitude = destination_longitude;
          bodyPayload.origin_latitude = settings?.warehouse_latitude || -6.9147;
          bodyPayload.origin_longitude = settings?.warehouse_longitude || 107.6098;
        }

        // Dynamically fetch Origin Hub (NINOC Central Warehouse) with in-memory TTL cache
        const defaultOrigin = await getOriginPostalCode();

        bodyPayload.origin_postal_code = origin_postal_code || defaultOrigin;

        const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        });

        const data = await response.json();

        // If success, return real data
        if (response.ok && data.success !== false) {
          const geoFiltered = applyGeographicRestrictions(data.pricing || [], destination_area_name);
          const fnbResult = applyFnBRestrictions(geoFiltered, items, destination_area_name);
          return NextResponse.json({ ...data, pricing: fnbResult.pricing, is_fnb_restricted: fnbResult.is_fnb_restricted, fnb_notice: fnbResult.fnb_notice, source: 'biteship' });
        }

        // If rates API error (no balance), fall back to mock
        if (!response.ok || data.success === false) {
          console.warn(`[Biteship Rates] API returned error: ${JSON.stringify(data)}`);
          
          if (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true') {
            return NextResponse.json({ success: false, error: data.error || 'Shipping API unavailable', source: 'biteship' }, { status: 500 });
          }

          const geoFiltered = applyGeographicRestrictions(MOCK_RATES.pricing, destination_area_name);
          const fnbResult = applyFnBRestrictions(geoFiltered, items, destination_area_name);
          return NextResponse.json({ ...MOCK_RATES, pricing: fnbResult.pricing, is_fnb_restricted: fnbResult.is_fnb_restricted, fnb_notice: fnbResult.fnb_notice, reason: data.error || 'API unavailable' });
        }

      } catch (apiErr) {
        // Network or other error
        console.error('[Biteship Rates] API call failed:', (apiErr as Error).message);
        if (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true') {
          return NextResponse.json({ success: false, error: 'Internal Shipping Server Error' }, { status: 500 });
        }
      }
    }

    // Fallback mock data — works without API activation
    if (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true') {
      return NextResponse.json({ success: false, error: 'Shipping API Key Not Configured' }, { status: 500 });
    }

    const geoFiltered = applyGeographicRestrictions(MOCK_RATES.pricing, destination_area_name);
    const fnbResult = applyFnBRestrictions(geoFiltered, items, destination_area_name);
    return NextResponse.json({ ...MOCK_RATES, pricing: fnbResult.pricing, is_fnb_restricted: fnbResult.is_fnb_restricted, fnb_notice: fnbResult.fnb_notice });

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Rates] Error:', error.message);
    if (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true') {
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
    
    // Still return mock data on unexpected error
    const fnbResult = applyFnBRestrictions(MOCK_RATES.pricing, []);
    return NextResponse.json({ ...MOCK_RATES, pricing: fnbResult.pricing, is_fnb_restricted: fnbResult.is_fnb_restricted, fnb_notice: fnbResult.fnb_notice, reason: error.message });
  }
}
