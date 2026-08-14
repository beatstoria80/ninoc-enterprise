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
 * @deprecated Prefer `getSnapApiSingleton()` to avoid creating a new client on every request.
 */
export const getSnapApi = () => new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey,
});

/**
 * Cached singleton instance for Midtrans Snap API.
 * Avoids re-instantiating the Snap client on every checkout request, reducing
 * memory allocations and internal TLS handshake overhead within the Midtrans SDK.
 */
let _snapSingleton: InstanceType<typeof midtransClient.Snap> | null = null;
export const getSnapApiSingleton = () => {
  if (!_snapSingleton) {
    _snapSingleton = new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    });
  }
  return _snapSingleton;
};
