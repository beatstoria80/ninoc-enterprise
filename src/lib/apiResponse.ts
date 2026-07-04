import { NextResponse } from 'next/server';

// ============================================================================
// NINOC ENTERPRISE — STANDARDIZED API RESPONSE WRAPPER & ERROR HANDLER
// ============================================================================
// Standardizes all HTTP responses across Next.js App Router endpoints.
// Eliminates ad-hoc try/catch boilerplate and ensures consistent JSON schema:
// - Success: { success: true, ...data }
// - Error:   { success: false, error: string, details?: any }
// ============================================================================

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: any;
}

/**
 * Send a standardized 2xx success JSON response.
 * @param data Object containing data key-value pairs (e.g. { departments: [...] })
 * @param status HTTP status code (default: 200)
 */
export function apiSuccess<T extends Record<string, any>>(
  data: T,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

/**
 * Send a standardized 4xx or 5xx error JSON response.
 * @param message Human-readable error message
 * @param status HTTP status code (default: 500)
 * @param details Optional diagnostic details or stack trace for debugging
 */
export function apiError(
  message: string,
  status = 500,
  details?: any
): NextResponse {
  const payload: Record<string, any> = {
    success: false,
    error: message,
  };

  if (details !== undefined && process.env.NODE_ENV !== 'production') {
    payload.details = details;
  }

  return NextResponse.json(payload, { status });
}

export function apiBadRequest(message = 'Bad Request', details?: any): NextResponse {
  return apiError(message, 400, details);
}

export function apiUnauthorized(message = 'Unauthorized', details?: any): NextResponse {
  return apiError(message, 401, details);
}

export function apiForbidden(message = 'Forbidden', details?: any): NextResponse {
  return apiError(message, 403, details);
}

export function apiNotFound(message = 'Resource Not Found', details?: any): NextResponse {
  return apiError(message, 404, details);
}

export function apiInternalError(
  message = 'Internal Server Error',
  details?: any
): NextResponse {
  return apiError(message, 500, details);
}

/**
 * Higher-order error handler wrapper for API route handlers.
 * Catches unhandled exceptions, logs them with route metadata, and returns a structured 500 response.
 */
export function withErrorHandler<R extends Request = Request>(
  handler: (req: R, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: R, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      console.error(`[API Error] Unhandled exception in ${req.url}:`, error);
      return apiInternalError(
        error?.message || 'An unexpected server error occurred',
        error?.stack
      );
    }
  };
}
