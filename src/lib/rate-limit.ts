/**
 * Simple in-memory rate limiter for Next.js App Router.
 * Useful for preventing basic abuse and spam on API routes.
 * 
 * Note: Since Next.js API routes may run in serverless functions,
 * this in-memory cache may be cleared frequently. For strict rate limiting
 * in production, consider Redis (Upstash) or Vercel Edge Middleware.
 */

type RateLimitContext = {
  count: number;
  resetAt: number;
};

const rateLimitCache = new Map<string, RateLimitContext>();

/**
 * Check if the request is allowed based on rate limits.
 * @param identifier Unique identifier for the request (e.g. IP address)
 * @param limit Maximum number of requests allowed within the window
 * @param windowMs Time window in milliseconds
 * @returns Object indicating if request is allowed and headers to return
 */
export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  let context = rateLimitCache.get(identifier);

  // Clean up expired entry
  if (context && context.resetAt < now) {
    context = undefined;
  }

  if (!context) {
    context = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  context.count += 1;
  rateLimitCache.set(identifier, context);

  const isAllowed = context.count <= limit;
  const remaining = Math.max(0, limit - context.count);

  return {
    isAllowed,
    limit,
    remaining,
    resetAt: context.resetAt,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(context.resetAt / 1000).toString(),
    },
  };
}
