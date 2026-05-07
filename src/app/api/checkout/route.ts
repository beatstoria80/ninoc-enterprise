import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function POST(req: Request) {
  try {
    const { items, customerDetails, totalPrice } = await req.json();

    // Initialize Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

    const orderId = `NINOC-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalPrice
      },
      customer_details: {
        first_name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        billing_address: {
          address: customerDetails.address,
          city: customerDetails.city,
          postal_code: customerDetails.zip
        }
      },
      item_details: items.map((item: any) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name
      })),
      credit_card: {
        secure: true
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // Note: In a real production app, you should also save the order to Supabase here
    // with 'pending' status.

    return NextResponse.json({ token: transaction.token, orderId });
  } catch (error: any) {
    console.error('Midtrans API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
