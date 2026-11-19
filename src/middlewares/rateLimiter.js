const { rateLimit } = require('express-rate-limit');
const { sendError } = require('../utils/response');

// Membatasi percobaan login per IP untuk mempersulit brute force password.
// 10 percobaan per 15 menit; setelah itu 429 Too Many Requests.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7', // kirim header RateLimit-* ke client
  legacyHeaders: false,
  handler: (req, res) =>
    sendError(res, {
      statusCode: 429,
      message: 'Too many login attempts, please try again in 15 minutes',
    }),
});

module.exports = { loginRateLimiter };
