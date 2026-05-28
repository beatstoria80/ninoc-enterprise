import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_area_id, origin_area_id, items } = body;

    // TODO: In a real app with Biteship API, you would do:
    // const res = await fetch('https://api.biteship.com/v1/rates/couriers', {
    //   headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BITESHIP_API_KEY}` }
    // });
    
    // For now, we simulate the standard response structure from Biteship
    // depending on the destination just to show it's "dynamic"
    // We add a slight delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockRates = {
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

    return NextResponse.json(mockRates);
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shipping rates' }, { status: 500 });
  }
}
