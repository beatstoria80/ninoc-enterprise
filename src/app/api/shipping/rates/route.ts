import { NextResponse } from 'next/server';
import { getBiteshipActivationSettings } from '@/lib/settings';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_area_id, origin_area_id, items } = body;

    const biteshipToken = process.env.BITESHIP_API_KEY;

    if (!biteshipToken || biteshipToken === 'your_biteship_api_key_here') {
      console.warn('[Shipping API] Missing BITESHIP_API_KEY. Falling back to mock rates.');
      return NextResponse.json(getMockRates());
    }

    const settings = await getBiteshipActivationSettings();
    const baseCouriers = settings?.activated_couriers?.join(',') || 'jne,jnt';

    const payload: any = {
      origin_area_id,
      destination_area_id,
      couriers: baseCouriers,
      items: items
    };

    if (body.destination_latitude && body.destination_longitude) {
       payload.destination_latitude = body.destination_latitude;
       payload.destination_longitude = body.destination_longitude;
       // We MUST provide origin lat/long for Gojek/Grab. Let's provide warehouse default
       payload.origin_latitude = -6.273763212850901;
       payload.origin_longitude = 106.79153549642674;
       // We let the activated_couriers rule here. If grab/gojek is active, they will be sent.
       payload.couriers = baseCouriers;
    }

    const res = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: { 
        'Authorization': biteshipToken, // Biteship v1 uses raw token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`[Shipping API] Biteship returned ${res.status}:`, await res.text());
      return NextResponse.json(getMockRates()); // Fallback on failure
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shipping rates' }, { status: 500 });
  }
}

function getMockRates() {
  return {
    success: true,
    object: "rates",
    pricing: [
      {
        company: "jne",
        type: "reg",
        courier_name: "JNE",
        courier_service_name: "REGULER",
        courier_service_code: "reg",
        description: "Layanan Reguler JNE",
        duration: "2-3 Days",
        price: 15000
      },
      {
        company: "jnt",
        type: "ez",
        courier_name: "J&T",
        courier_service_name: "EZ",
        courier_service_code: "ez",
        description: "Layanan Cepat J&T",
        duration: "1-2 Days",
        price: 12000
      },
      {
        company: "sicepat",
        type: "best",
        courier_name: "SiCepat",
        courier_service_name: "BEST",
        courier_service_code: "best",
        description: "Layanan Prioritas SiCepat",
        duration: "1 Day",
        price: 18000
      }
    ]
  };
}
