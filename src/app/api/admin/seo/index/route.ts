import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';

export async function POST(request: Request) {
  try {
    const { url, action = 'URL_UPDATED' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Google Service Account Credentials from .env.local
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      // If keys are not set yet, we just return a warning so the frontend doesn't crash
      return NextResponse.json(
        { 
          success: false, 
          message: 'Google Service Account credentials not configured yet. Skipping indexing.' 
        },
        { status: 200 } // Return 200 so it doesn't break the UI, just skips
      );
    }

    // Authenticate with Google
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const tokens = await jwtClient.authorize();
    
    // Call the Indexing API
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({
        url: url,
        type: action,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Indexing API Error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to request indexing' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error requesting Google Indexing:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
