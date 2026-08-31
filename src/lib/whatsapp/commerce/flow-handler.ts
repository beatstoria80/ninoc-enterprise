/**
 * NINOC WhatsApp Commerce — Flow Handler
 *
 * Processes data exchange requests from WhatsApp Flows.
 * When a user interacts with a Flow screen, Meta sends
 * the screen data to our endpoint for processing.
 *
 * This handler serves dynamic data (dropdowns, validation)
 * and processes form submissions.
 */

import type {
  WAFlowDataRequest,
  WAFlowDataResponse,
  WAFlowTerminalResponse,
  ShippingAddress,
} from './types';
import { updateOrderSession } from '@/lib/order-token';

// ─── Flow Screen Handlers ──────────────────────────────────────────────────────

/**
 * Process a Flow data exchange request.
 * Called by the Flow data endpoint when Meta sends screen data.
 */
export async function processFlowRequest(
  request: WAFlowDataRequest
): Promise<WAFlowDataResponse | WAFlowTerminalResponse> {
  console.log(
    `[WA-Commerce-Flow] Processing: action=${request.action}, screen=${request.screen}`
  );

  // Handle ping (health check from Meta)
  if (request.action === 'ping') {
    return {
      version: request.version,
      screen: 'PING',
      data: {},
    };
  }

  // Handle INIT (first screen load)
  if (request.action === 'INIT') {
    return handleInit(request);
  }

  // Handle data exchange (user submitted a screen)
  if (request.action === 'data_exchange') {
    return handleDataExchange(request);
  }

  // Handle BACK navigation
  if (request.action === 'BACK') {
    return handleBack(request);
  }

  // Unknown action
  return {
    version: request.version,
    screen: request.screen,
    data: { error: 'Unknown action' },
  };
}

// ─── INIT Handler ──────────────────────────────────────────────────────────────

function handleInit(
  request: WAFlowDataRequest
): WAFlowDataResponse {
  // Return initial data for the first screen
  return {
    version: request.version,
    screen: 'ADDRESS_FORM',
    data: {
      // Province dropdown options
      provinces: getProvinceOptions(),
      // Pre-fill data if available
      ...(request.data || {}),
    },
  };
}

// ─── Data Exchange Handler ─────────────────────────────────────────────────────

async function handleDataExchange(
  request: WAFlowDataRequest
): Promise<WAFlowDataResponse | WAFlowTerminalResponse> {
  const { screen, data, flow_token } = request;

  switch (screen) {
    case 'ADDRESS_FORM': {
      // User submitted address form — validate & get cities
      const province = data.province as string;
      if (!province) {
        return {
          version: request.version,
          screen: 'ADDRESS_FORM',
          data: {
            error_message: 'Silakan pilih provinsi',
            provinces: getProvinceOptions(),
          },
        };
      }

      // Return city options for selected province
      return {
        version: request.version,
        screen: 'ADDRESS_DETAIL',
        data: {
          selected_province: province,
          cities: getCityOptions(province),
        },
      };
    }

    case 'ADDRESS_DETAIL': {
      // User submitted detailed address
      const address: ShippingAddress = {
        recipient_name: (data.recipient_name as string) || '',
        phone: (data.phone as string) || '',
        province: (data.province as string) || '',
        city: (data.city as string) || '',
        district: (data.district as string) || '',
        full_address: (data.full_address as string) || '',
        postal_code: (data.postal_code as string) || '',
      };

      // Validate required fields
      if (!address.recipient_name || !address.phone || !address.full_address) {
        return {
          version: request.version,
          screen: 'ADDRESS_DETAIL',
          data: {
            error_message: 'Mohon lengkapi semua field yang wajib',
            ...data,
          },
        };
      }

      // Save address to order session
      if (flow_token) {
        await updateOrderSession(flow_token, {
          shipping_address: address,
        });
      }

      // Terminal response — Flow is complete
      return {
        version: request.version,
        screen: 'SUCCESS',
        data: {
          extension_message_response: {
            params: {
              flow_token,
              address_saved: true,
            },
          },
        },
      };
    }

    default:
      return {
        version: request.version,
        screen: request.screen,
        data: { error: `Unknown screen: ${screen}` },
      };
  }
}

// ─── BACK Handler ──────────────────────────────────────────────────────────────

function handleBack(
  request: WAFlowDataRequest
): WAFlowDataResponse {
  // Navigate back to previous screen
  const screenMap: Record<string, string> = {
    ADDRESS_DETAIL: 'ADDRESS_FORM',
    COURIER_SELECTION: 'ADDRESS_DETAIL',
    ORDER_REVIEW: 'COURIER_SELECTION',
  };

  const previousScreen = screenMap[request.screen] || 'ADDRESS_FORM';

  return {
    version: request.version,
    screen: previousScreen,
    data: {
      ...(request.data || {}),
      provinces: getProvinceOptions(),
    },
  };
}

// ─── Static Data (Province/City options) ───────────────────────────────────────

/**
 * Province dropdown options for address form.
 * Using Biteship-compatible province names.
 *
 * TODO: Phase 3 — Dynamically fetch from Biteship or Supabase wilayah table
 */
function getProvinceOptions() {
  return [
    { id: 'banten', title: 'Banten' },
    { id: 'dki-jakarta', title: 'DKI Jakarta' },
    { id: 'jawa-barat', title: 'Jawa Barat' },
    { id: 'jawa-tengah', title: 'Jawa Tengah' },
    { id: 'jawa-timur', title: 'Jawa Timur' },
    { id: 'di-yogyakarta', title: 'DI Yogyakarta' },
    { id: 'bali', title: 'Bali' },
    { id: 'sumatera-utara', title: 'Sumatera Utara' },
    { id: 'sumatera-barat', title: 'Sumatera Barat' },
    { id: 'sumatera-selatan', title: 'Sumatera Selatan' },
    { id: 'kalimantan-selatan', title: 'Kalimantan Selatan' },
    { id: 'kalimantan-timur', title: 'Kalimantan Timur' },
    { id: 'sulawesi-selatan', title: 'Sulawesi Selatan' },
    // ... extend in Phase 3
  ];
}

/**
 * City dropdown options based on selected province.
 *
 * TODO: Phase 3 — Dynamically fetch from Biteship API
 */
function getCityOptions(provinceId: string) {
  const cityMap: Record<string, Array<{ id: string; title: string }>> = {
    'jawa-barat': [
      { id: 'bandung', title: 'Kota Bandung' },
      { id: 'bandung-kab', title: 'Kabupaten Bandung' },
      { id: 'bandung-barat', title: 'Bandung Barat' },
      { id: 'bogor', title: 'Kota Bogor' },
      { id: 'bekasi', title: 'Kota Bekasi' },
      { id: 'depok', title: 'Kota Depok' },
      { id: 'cimahi', title: 'Kota Cimahi' },
      { id: 'garut', title: 'Garut' },
      { id: 'tasikmalaya', title: 'Tasikmalaya' },
    ],
    'dki-jakarta': [
      { id: 'jakarta-pusat', title: 'Jakarta Pusat' },
      { id: 'jakarta-utara', title: 'Jakarta Utara' },
      { id: 'jakarta-selatan', title: 'Jakarta Selatan' },
      { id: 'jakarta-barat', title: 'Jakarta Barat' },
      { id: 'jakarta-timur', title: 'Jakarta Timur' },
    ],
    // ... extend in Phase 3
  };

  return cityMap[provinceId] || [{ id: 'other', title: 'Kota/Kabupaten Lainnya' }];
}
