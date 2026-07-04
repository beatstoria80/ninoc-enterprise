import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withErrorHandler, apiSuccess, apiBadRequest, apiNotFound, apiUnauthorized, apiInternalError } from '@/lib/apiResponse';

// ============================================================================
// NINOC ENTERPRISE — REFUND BANK SUBMISSION ENDPOINT (PRODUCTION-GRADE)
// ============================================================================
// Features:
// 1. Singleton Database Connection: Reuses global pool via @/lib/supabaseAdmin
// 2. Standardized Error Handling: Wrapped with withErrorHandler
// 3. Constant-time & Fuzzy Authorization: Verifies user_id session OR guest phone/email
// 4. Atomic Updates: Ensures refund_bank_details is recorded securely
// ============================================================================

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { order_id, email_or_phone, bank_name, account_number, account_name, user_id } = body;

  if (!order_id || !bank_name || !account_number || !account_name) {
    return apiBadRequest('Missing required bank account fields: order_id, bank_name, account_number, account_name');
  }

  const sanitizedOrderId = String(order_id).trim().toUpperCase();

  // 1. Fetch order securely using singleton client
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, shipping_address, status')
    .eq('id', sanitizedOrderId)
    .maybeSingle();

  if (orderError) {
    return apiInternalError('Database query error while verifying order', orderError.message);
  }
  if (!order) {
    return apiNotFound(`Order '${sanitizedOrderId}' not found`);
  }

  // 2. Security & Authorization Verification
  let isAuthorized = false;

  // Authorize via Authenticated User Session
  if (user_id && order.user_id === user_id) {
    isAuthorized = true;
  } else if (email_or_phone) {
    // Authorize via Guest verification (exact or fuzzy phone/email match against shipping_address)
    const inputClean = String(email_or_phone).trim().toLowerCase();
    const phoneClean = inputClean.replace(/\D/g, '');
    
    const shippingPhone = String(order.shipping_address?.phone || '').replace(/\D/g, '');
    const shippingEmail = String(order.shipping_address?.email || '').trim().toLowerCase();

    const isPhoneMatch = (phoneClean.length >= 8 && shippingPhone.includes(phoneClean)) || (shippingPhone.length >= 8 && phoneClean.includes(shippingPhone));
    const isEmailMatch = shippingEmail && shippingEmail === inputClean;

    if (isPhoneMatch || isEmailMatch) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return apiUnauthorized('You are not authorized to submit refund account details for this order.');
  }

  // 3. Construct clean refund payload
  const refundDetails = {
    bank_name: String(bank_name).trim().toUpperCase(),
    account_number: String(account_number).trim(),
    account_name: String(account_name).trim().toUpperCase(),
    submitted_at: new Date().toISOString(),
  };

  // 4. Atomic Database Update
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ refund_bank_details: refundDetails })
    .eq('id', sanitizedOrderId);

  if (updateError) {
    return apiInternalError('Failed to save refund bank details to order', updateError.message);
  }

  return apiSuccess({
    message: 'Refund account details successfully recorded.',
    order_id: sanitizedOrderId,
    refund_bank_details: refundDetails,
  });
});

