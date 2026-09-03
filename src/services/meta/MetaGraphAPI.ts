const GRAPH_API_VERSION = 'v19.0';
const BASE_GRAPH_URL = 'https://graph.facebook.com';
const CACHE_REVALIDATE_SECONDS = 300; // 5 minutes

/**
 * Reusable HTTP Request Wrapper for Facebook Graph API.
 * Handles unified parameters, error boundary decoding, and revalidation logic.
 */
export async function metaGraphFetch<T = any>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string | number> = {},
  revalidate = CACHE_REVALIDATE_SECONDS
): Promise<T> {
  const queryParams = new URLSearchParams();
  queryParams.set('access_token', accessToken);
  
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      queryParams.set(key, String(val));
    }
  });

  const url = `${BASE_GRAPH_URL}/${GRAPH_API_VERSION}/${endpoint}?${queryParams.toString()}`;
  const res = await fetch(url, {
    next: { revalidate }
  });

  const data = await res.json().catch(() => ({} as any));

  if (!res.ok || data?.error) {
    const message = data?.error?.message || `Facebook Graph API error (status: ${res.status})`;
    const code = data?.error?.code || res.status;
    const err = new Error(message);
    (err as any).graphApiCode = code;
    throw err;
  }

  return data as T;
}
