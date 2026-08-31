/**
 * NINOC WhatsApp Commerce — Flow Data Endpoint
 *
 * This endpoint serves data to WhatsApp Flows during
 * the checkout process. When a user interacts with a Flow
 * screen, Meta sends the data here for processing.
 *
 * @see https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { processFlowRequest } from '@/lib/whatsapp/commerce/flow-handler';
import type { WAFlowDataRequest } from '@/lib/whatsapp/commerce/types';

export async function POST(req: NextRequest) {
  try {
    const body: WAFlowDataRequest = await req.json();

    console.log(
      `[WA-Commerce-Flow-Endpoint] action=${body.action}, screen=${body.screen}`
    );

    const response = await processFlowRequest(body);

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('[WA-Commerce-Flow-Endpoint] Error:', err);
    return NextResponse.json(
      {
        version: '3.0',
        screen: 'ERROR',
        data: { error: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
