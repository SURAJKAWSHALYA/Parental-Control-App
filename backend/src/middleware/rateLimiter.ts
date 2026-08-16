import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

// API global limiter - 15 minutes window
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 5000, // 300 in prod, 5000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

// Authentication limiter - 1 hour window
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: isProd ? 10 : 5000, // 10 attempts per hour in prod, 5000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after an hour',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

// Media upload limiter - 1 hour window
export const mediaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 50 : 5000, // max 50 uploads per hour per IP in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Media upload quota exceeded, please try again later',
    errorCode: 'MEDIA_RATE_LIMIT_EXCEEDED'
  }
});
