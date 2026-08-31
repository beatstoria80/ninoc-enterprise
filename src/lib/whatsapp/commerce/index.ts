/**
 * NINOC WhatsApp Commerce — Module Index
 *
 * Re-exports all commerce modules for clean imports.
 *
 * Usage:
 *   import { sendTextMessage, buildOrderSummary } from '@/lib/whatsapp/commerce';
 */

// Types
export type {
  WACloudAPIConfig,
  WAWebhookPayload,
  WAIncomingMessage,
  WAInteractiveReply,
  WAFlowReply,
  WAOrderSession,
  CartSnapshot,
  CartSnapshotItem,
  ShippingAddress,
  SelectedCourier,
  WACommerceAPIResponse,
  WAFlowDataRequest,
  WAFlowDataResponse,
  WAFlowTerminalResponse,
} from './types';

// Client
export {
  isCommerceConfigured,
  sendTextMessage,
  sendInteractiveMessage,
  sendCTAUrlMessage,
  sendFlowMessage,
  sendImageMessage,
  markAsRead,
} from './client';

// Message Builder
export {
  buildOrderSummary,
  buildAddressConfirmation,
  buildCourierSelection,
  buildOrderReview,
  buildPaymentSuccess,
  buildWelcomeMessage,
} from './message-builder';

// Security
export {
  verifyWebhookSignature,
  isTimestampValid,
  deduplicateMessage,
  checkRateLimit,
  runSecurityCleanup,
} from './security';

// Flow Handler
export { processFlowRequest } from './flow-handler';
