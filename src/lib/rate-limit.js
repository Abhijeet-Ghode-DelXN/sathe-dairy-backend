// lib/rate-limit.js
import { Redis } from '@upstash/redis'

// Create Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || 'your-redis-url',
  token: process.env.REDIS_TOKEN || 'your-redis-token'
})

export async function rateLimit(req) {
  if (process.env.NODE_ENV === 'development') {
    return { success: true }; // Skip rate limiting in development
  }

  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const key = `rate-limit:${ip}`;
    const limit = 100; // Number of requests
    const duration = 60; // Time window in seconds

    const requests = await redis.incr(key);
    
    if (requests === 1) {
      await redis.expire(key, duration);
    }

    if (requests > limit) {
      return {
        success: false,
        message: 'Too many requests',
        limit,
        remaining: 0,
        reset: await redis.ttl(key)
      };
    }

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - requests),
      reset: await redis.ttl(key)
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { success: true }; // Fail open if rate limiting errors
  }
}