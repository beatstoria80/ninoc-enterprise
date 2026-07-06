import midtransClient from 'midtrans-client';

const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
export const isProduction = serverKey.startsWith('SB-') ? false : (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true');

/**
 * Singleton instance for Midtrans CoreApi (used in webhooks and transaction status checks).
 */
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey,
  clientKey,
});

/**
 * Factory for Midtrans Snap API (used in checkout transactions).
 * Centralizes environment configuration and key resolution across all endpoints.
 */
export const getSnapApi = () => new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey,
});

