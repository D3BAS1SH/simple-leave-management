import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Applies to all routes
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for health check endpoint
        return req.path === '/' || req.path === '/health';
    }
});

/**
 * Strict rate limiter for sensitive operations
 * Apply to login, registration, password reset, etc.
 */
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // skipSuccessfulRequests: true, // Removed - we want to count all requests including successful ones
});

/**
 * Moderate rate limiter for leave operations
 * Prevents spam leave applications
 */
export const leaveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 leave applications per hour
    message: {
        error: 'Too many leave requests from this IP, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Lenient rate limiter for read operations
 * Applied to GET endpoints
 */
export const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    message: {
        error: 'Too many read requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
