import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  handler: (req, res, _next, options) => {
    const message =
      typeof options.message === 'string'
        ? options.message
        : 'Too many requests, please try again later.';
    res.status(options.statusCode).json({
      error: message,
      requestId: req.id,
    });
  },
});
