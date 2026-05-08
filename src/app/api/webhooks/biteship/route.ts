import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // TEMPORARY: RETURN 200 OK FOR BITESHIP INSTALLATION
  // You can revert this once the webhook is verified in Biteship dashboard
  console.log('[Biteship Webhook] Installation mode active - returning 200 OK');
  
  return NextResponse.json({ 
    status: 'OK', 
    message: 'Webhook installation successful' 
  }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'NINOC Biteship Webhook Installation Mode',
    timestamp: new Date().toISOString(),
  });
}
