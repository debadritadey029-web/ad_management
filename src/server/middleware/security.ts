/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

// In-memory token bucket rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function createRateLimiter(options: { windowMs: number; maxRequests: number; message?: string }) {
  const { windowMs, maxRequests, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // In testing or disabled environments
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const route = req.baseUrl + req.path;
    const key = `${ip}:${route}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: message || 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Enterprise security headers middleware.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Generate request correlation ID
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/**
 * Standardized API error handler preventing leak of internal stack traces.
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = typeof err.status === 'number' ? err.status : 500;
  const requestId = res.getHeader('X-Request-Id');

  console.error(`[API Error] RequestId: ${requestId} | Method: ${req.method} | URL: ${req.originalUrl} | Error:`, err);

  res.status(status).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected internal server error occurred.',
    requestId,
  });
}
