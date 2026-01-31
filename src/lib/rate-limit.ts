/**
 * Simple in-memory rate limiter for API routes
 * For production at scale, consider using Redis or Upstash
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // New window or expired entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      reset: now + config.windowMs,
    };
  }

  if (entry.count >= config.limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment counter
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}
