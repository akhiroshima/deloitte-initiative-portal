// Simple in-memory rate limiting for Netlify Functions
// In production, use Redis or a proper rate limiting service

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (event: any) => string; // Custom key generator
}

const defaultKeyGenerator = (event: any): string => {
  // Use IP address as default key
  const forwarded = event.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : event.headers['client-ip'] || 'unknown';
  return ip;
};

export const rateLimit = (config: RateLimitConfig) => {
  const { windowMs, maxRequests, keyGenerator = defaultKeyGenerator } = config;
  
  return (event: any) => {
    const key = keyGenerator(event);
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
    
    const entry = rateLimitStore.get(key);
    
    if (!entry) {
      // First request
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }
    
    if (now > entry.resetTime) {
      // Window expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }
    
    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }
    
    // Increment count
    entry.count++;
    return { 
      allowed: true, 
      remaining: maxRequests - entry.count, 
      resetTime: entry.resetTime 
    };
  };
};

// Predefined rate limit configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 attempts per 15 minutes (increased for development)
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per 15 minutes
});

export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
});

// Rate limit response helper
export const createRateLimitResponse = (result: ReturnType<ReturnType<typeof rateLimit>>) => {
  if (!result.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.retryAfter?.toString() || '60',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter
      })
    };
  }
  
  return null; // No rate limit response needed
};
