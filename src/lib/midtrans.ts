import midtransClient from 'midtrans-client';

const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const isProduction = serverKey.startsWith('SB-') ? false : (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true');

export const coreApi = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
});
