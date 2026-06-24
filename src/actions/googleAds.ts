"use server";

import { GoogleAdsApi } from 'google-ads-api';

// This function fetches the total ad spend for today or the current month.
// You must provide the credentials in your .env.local file.
export async function getAdSpend(): Promise<number> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID; // The client customer ID you want to query

  // Check if any credential is missing
  if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
    console.warn('Google Ads credentials are not fully set. Returning 0 for Ad Spend.');
    return 0;
  }

  try {
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    });

    // Query to get the total cost in the last 30 days or this month.
    // Cost is returned in micros (1 unit = 1,000,000 micros).
    const query = `
      SELECT metrics.cost_micros
      FROM customer
      WHERE segments.date DURING THIS_MONTH
    `;

    const response = await customer.query(query);
    
    let totalCostMicros = 0;
    if (response && response.length > 0 && response[0].metrics?.cost_micros) {
        totalCostMicros = Number(response[0].metrics.cost_micros);
    }

    // Convert micros to actual currency amount (e.g. IDR)
    // 1 IDR = 1,000,000 micros
    const totalCost = totalCostMicros / 1000000;

    return totalCost;
  } catch (error) {
    console.error('Failed to fetch Ad Spend from Google Ads API:', error);
    // Return 0 so it doesn't break the dashboard
    return 0;
  }
}
