/**
 * NINOC WhatsApp Commerce — Type Definitions
 *
 * TypeScript interfaces for Meta WhatsApp Cloud API v21.0
 * Interactive Messages, Flows, Webhooks, and Commerce-specific types.
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/reference
 */

// ─── Cloud API Base Types ──────────────────────────────────────────────────────

export interface WACloudAPIConfig {
  apiVersion: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
}

// ─── Webhook Incoming Types ────────────────────────────────────────────────────

export interface WAWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WAWebhookEntry[];
}

export interface WAWebhookEntry {
  id: string;
  changes: WAWebhookChange[];
}

export interface WAWebhookChange {
  value: WAWebhookValue;
  field: 'messages';
}

export interface WAWebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WAContact[];
  messages?: WAIncomingMessage[];
  statuses?: WAMessageStatus[];
}

export interface WAContact {
  profile: { name: string };
  wa_id: string;
}

export interface WAIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: WAMessageType;
  text?: { body: string };
  interactive?: WAInteractiveReply;
  button?: { text: string; payload: string };
  /** Response from a WhatsApp Flow */
  nfm_reply?: WAFlowReply;
}

export type WAMessageType =
  | 'text'
  | 'interactive'
  | 'button'
  | 'image'
  | 'document'
  | 'location'
  | 'nfm_reply'  // Flow response
  | 'order'
  | 'system'
  | 'unknown';

export interface WAInteractiveReply {
  type: 'button_reply' | 'list_reply';
  button_reply?: { id: string; title: string };
  list_reply?: { id: string; title: string; description?: string };
}

export interface WAFlowReply {
  response_json: string; // JSON string of flow response data
  body: string;
  name: string;
}

export interface WAMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data?: { details: string };
  }>;
}

// ─── Outgoing Message Types ────────────────────────────────────────────────────

export interface WAOutgoingTextMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: { body: string; preview_url?: boolean };
}

export interface WAOutgoingInteractiveMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: WAInteractiveContent;
}

export type WAInteractiveContent =
  | WAInteractiveButtons
  | WAInteractiveList
  | WAInteractiveFlow;

export interface WAInteractiveButtons {
  type: 'button';
  header?: WAInteractiveHeader;
  body: { text: string };
  footer?: { text: string };
  action: {
    buttons: Array<{
      type: 'reply';
      reply: { id: string; title: string };
    }>;
  };
}

export interface WAInteractiveList {
  type: 'list';
  header?: WAInteractiveHeader;
  body: { text: string };
  footer?: { text: string };
  action: {
    button: string; // Button text to open list
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

export interface WAInteractiveFlow {
  type: 'flow';
  header?: WAInteractiveHeader;
  body: { text: string };
  footer?: { text: string };
  action: {
    name: 'flow';
    parameters: {
      flow_message_version: '3';
      flow_token: string;
      flow_id: string;
      flow_cta: string; // Call-to-action button text
      flow_action: 'navigate' | 'data_exchange';
      flow_action_payload?: {
        screen: string;
        data?: Record<string, unknown>;
      };
    };
  };
}

export interface WAInteractiveHeader {
  type: 'text' | 'image' | 'video' | 'document';
  text?: string;
  image?: { link: string };
  video?: { link: string };
  document?: { link: string; filename: string };
}

// ─── CTA URL Button Message ───────────────────────────────────────────────────

export interface WAOutgoingCTAMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'cta_url';
    header?: WAInteractiveHeader;
    body: { text: string };
    footer?: { text: string };
    action: {
      name: 'cta_url';
      parameters: {
        display_text: string;
        url: string;
      };
    };
  };
}

// ─── WhatsApp Flow Data Types ──────────────────────────────────────────────────

export interface WAFlowDataRequest {
  version: string;
  action: 'ping' | 'INIT' | 'data_exchange' | 'BACK';
  screen: string;
  data: Record<string, unknown>;
  flow_token: string;
}

export interface WAFlowDataResponse {
  version: string;
  screen: string;
  data: Record<string, unknown>;
}

export interface WAFlowTerminalResponse {
  version: string;
  screen: 'SUCCESS';
  data: {
    extension_message_response: {
      params: {
        flow_token: string;
        [key: string]: unknown;
      };
    };
  };
}

// ─── Commerce-Specific Types ───────────────────────────────────────────────────

export interface WAOrderSession {
  id: string;
  order_token: string;
  cart_snapshot: CartSnapshot;
  user_phone: string | null;
  shipping_address: ShippingAddress | null;
  selected_courier: SelectedCourier | null;
  midtrans_snap_token: string | null;
  payment_status: 'pending' | 'paid' | 'expired' | 'cancelled';
  wa_message_id: string | null;
  created_at: string;
  expires_at: string;
  is_sandbox: boolean;
}

export interface CartSnapshot {
  items: CartSnapshotItem[];
  subtotal: number;
  currency: string;
}

export interface CartSnapshotItem {
  product_id: string;
  product_name: string;
  variant_label?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  image_url?: string;
  weight_grams: number;
  is_perishable: boolean;
}

export interface ShippingAddress {
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  full_address: string;
  postal_code: string;
}

export interface SelectedCourier {
  courier_code: string;
  courier_name: string;
  service_type: string;
  service_name: string;
  price: number;
  estimated_days: string;
}

export interface WAMessageLogEntry {
  id: string;
  direction: 'inbound' | 'outbound';
  wa_message_id: string | null;
  phone_number: string;
  message_type: string;
  payload: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  created_at: string;
  is_sandbox: boolean;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface WACommerceAPIResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  error_code?: string;
}

// ─── Commerce Domain Types ─────────────────────────────────────────────────────

export interface CourierOption {
  courier_code: string;
  courier_name: string;
  service_type: string;
  service_name: string;
  price: number;
  estimated_days: string;
}

// ─── Button ID Constants (Single Source of Truth) ──────────────────────────────

/**
 * All interactive button IDs used across message-builder and webhook handler.
 * Centralised here to prevent magic string mismatches between the two files.
 */
export const BUTTON_IDS = {
  // Order summary actions
  CONTINUE_CHECKOUT: 'btn_continue_checkout',
  EDIT_CART: 'btn_edit_cart',
  CANCEL_ORDER: 'btn_cancel_order',

  // Welcome menu
  BROWSE_PRODUCTS: 'btn_browse_products',
  CHECK_ORDER: 'btn_check_order',
  HELP: 'btn_help',

  // Address confirmation
  ADDRESS_CONFIRM: 'btn_address_confirm',
  ADDRESS_CHANGE: 'btn_address_change',

  // Payment
  PAY_NOW: 'btn_pay_now',

  // Post-purchase
  TRACK_ORDER: 'btn_track_order',
  SHOP_MORE: 'btn_shop_more',
} as const;

export type ButtonId = (typeof BUTTON_IDS)[keyof typeof BUTTON_IDS];
