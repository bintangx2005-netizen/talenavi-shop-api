const { rateLimit } = require('express-rate-limit');
const { sendError } = require('../utils/response');

// Membatasi percobaan login per IP untuk mempersulit brute force password.
// 10 percobaan per 15 menit; setelah itu 429 Too Many Requests.
// Catatan: hitungannya disimpan di memori server, jadi ter-reset saat server restart.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit dalam milidetik
  limit: 10,
  standardHeaders: 'draft-7', // kirim header RateLimit-* ke client
  legacyHeaders: false,
  // Response 429 tetap memakai format JSON yang sama dengan error lain
  handler: (req, res) =>
    sendError(res, {
      statusCode: 429,
      message: 'Too many login attempts, please try again in 15 minutes',
    }),
});

module.exports = { loginRateLimiter };
