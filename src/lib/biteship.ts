/**
 * Biteship API Client Library
 * Handles all communication with Biteship API v1
 * Docs: https://biteship.com/docs/api
 */

const BITESHIP_BASE_URL = 'https://api.biteship.com';

function getApiKey(): string {
  const key = process.env.BITESHIP_API_KEY;
  if (!key) {
    throw new Error('BITESHIP_API_KEY is not configured. Please set it in .env.local');
  }
  return key;
}

async function biteshipFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BITESHIP_BASE_URL}${endpoint}`;
  const apiKey = getApiKey();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Biteship API] ${response.status} error:`, errorBody);
    throw new Error(`Biteship API error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================
// SHIPPING RATES
// ============================================================

export interface BiteshipRate {
  id: string;
  company: string;
  courier_name: string;
  courier_service_name: string;
  courier_service_code: string;
  description: string;
  duration: string;
  price: number;
}

export interface BiteshipRatesRequest {
  destination_area_id: string;
  origin_area_id?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    weight: number; // in grams
    height?: number; // in cm
    length?: number; // in cm
    width?: number; // in cm
  }[];
  couriers?: string; // e.g. "jne,tiki,pos,sicepat,jnt,anteraja,ninja"
}

export interface BiteshipRatesResponse {
  success: boolean;
  object: string;
  pricing: BiteshipRate[];
  available_couriers: string[];
}

export async function getShippingRates(params: BiteshipRatesRequest): Promise<BiteshipRatesResponse> {
  return biteshipFetch<BiteshipRatesResponse>('/v1/rates/couriers', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ============================================================
// AREAS / LOCATION
// ============================================================

export interface BiteshipArea {
  id: string;
  name: string;
  postal_code?: string;
  city_name?: string;
  province_name?: string;
  type?: string;
}

export async function getProvinces(): Promise<BiteshipArea[]> {
  const data = await biteshipFetch<{ data: BiteshipArea[] }>('/v1/areas/provinces');
  return data.data;
}

export async function getCities(provinceId: string): Promise<BiteshipArea[]> {
  const data = await biteshipFetch<{ data: BiteshipArea[] }>(`/v1/areas/cities?province_id=${provinceId}`);
  return data.data;
}

export async function getDistricts(cityId: string): Promise<BiteshipArea[]> {
  const data = await biteshipFetch<{ data: BiteshipArea[] }>(`/v1/areas/districts?city_id=${cityId}`);
  return data.data;
}

export async function searchAreas(keyword: string): Promise<BiteshipArea[]> {
  const data = await biteshipFetch<{ data: BiteshipArea[] }>(`/v1/areas?keywords=${encodeURIComponent(keyword)}`);
  return data.data;
}

// ============================================================
// CREATE SHIPMENT (CREATE WAYBILL)
// ============================================================

export interface BiteshipOrderItem {
  id: string;
  name: string;
  description?: string;
  value: number;
  quantity: number;
  weight: number; // grams
  height?: number;
  length?: number;
  width?: number;
}

export interface BiteshipAddress {
  contact_name: string;
  contact_phone: string;
  address: string;
  postcode?: string;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
  note?: string;
}

export interface BiteshipOrderRequest {
  external_id: string; // Our order ID
  courier_company: string; // jne | jnt | sicepat | etc.
  courier_type: string; // reg | yes | best | ez | cargo | etc.
  destination: BiteshipAddress;
  origin: BiteshipAddress;
  items: BiteshipOrderItem[];
  metadata?: Record<string, string>;
}

export interface BiteshipOrderResponse {
  success: boolean;
  waybill_id: string;
  tracking_id: string;
  courier_company: string;
  courier_name: string;
  courier_type: string;
  status: string;
  estimated_pickup?: string;
  estimated_delivery?: string;
  created_at: string;
}

export async function createBiteshipOrder(order: BiteshipOrderRequest): Promise<BiteshipOrderResponse> {
  return biteshipFetch<BiteshipOrderResponse>('/v1/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

// ============================================================
// TRACK SHIPMENT (WAYBILL TRACKING)
// ============================================================

export interface BiteshipTrackingEvent {
  id: string;
  status: string;
  message: string;
  occurred_at: string;
  location?: {
    name?: string;
    contact_name?: string;
  };
}

export interface BiteshipTrackingResponse {
  success: boolean;
  tracking_id: string;
  waybill_id: string;
  courier_company: string;
  courier_name: string;
  status: string;
  estimated_pickup_date?: string;
  estimated_delivery_date?: string;
  summary: {
    pickup?: string;
    delivered?: string;
    last_updated?: string;
  };
  history: BiteshipTrackingEvent[];
}

export async function trackShipment(trackingId: string): Promise<BiteshipTrackingResponse> {
  return biteshipFetch<BiteshipTrackingResponse>(`/v1/trackings/${trackingId}`, {
    method: 'GET',
  });
}

// ============================================================
// GET ORDER STATUS
// ============================================================

export interface BiteshipOrderDetail {
  id: string;
  external_id: string;
  waybill_id: string;
  courier_company: string;
  courier_type: string;
  status: string;
  pickup_date?: string;
  delivery_date?: string;
  destination: BiteshipAddress;
  origin: BiteshipAddress;
  items: BiteshipOrderItem[];
}

export async function getBiteshipOrder(orderId: string): Promise<BiteshipOrderDetail> {
  return biteshipFetch<BiteshipOrderDetail>(`/v1/orders/${orderId}`);
}

// ============================================================
// CANCEL ORDER
// ============================================================

export interface BiteshipCancelOrderResponse {
  success: boolean;
  message: string;
  status: string;
  id: string;
}

export async function cancelBiteshipOrder(orderId: string, reason: string): Promise<BiteshipCancelOrderResponse> {
  return biteshipFetch<BiteshipCancelOrderResponse>(`/v1/orders/${orderId}`, {
    method: 'DELETE',
    body: JSON.stringify({ cancellation_reason: reason }),
  });
}

// ============================================================
// COURIER MAPPING
// ============================================================

export const COURIER_LIST = [
  { id: 'jne', name: 'JNE', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png' },
  { id: 'grab', name: 'GrabExpress', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Grab_logo.svg/1024px-Grab_logo.svg.png' },
  { id: 'gojek', name: 'GoSend', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Gojek_logo_2019.svg/1024px-Gojek_logo_2019.svg.png' },
];

export const COURIER_SERVICES: Record<string, { code: string; name: string }[]> = {
  jne: [
    { code: 'reg', name: 'REGULER (2-3 Days)' },
    { code: 'yes', name: 'YES (1 Day)' },
    { code: 'oke', name: 'OKE (3-5 Days)' },
    { code: 'trucking', name: 'JTR (Cargo)' },
  ],
  grab: [
    { code: 'instant', name: 'Instant (1-3 Hours)' },
    { code: 'sameday', name: 'Same Day (6-8 Hours)' },
  ],
  gojek: [
    { code: 'instant', name: 'Instant (1-3 Hours)' },
    { code: 'sameday', name: 'Same Day (6-8 Hours)' },
  ]
};