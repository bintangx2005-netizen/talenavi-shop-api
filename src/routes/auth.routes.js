const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { loginRateLimiter } = require('../middlewares/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// Routes = peta "URL + method -> middleware -> controller".
// Middleware dijalankan berurutan dari kiri ke kanan; kalau ada yang gagal,
// yang di kanannya tidak dijalankan.
const router = Router();

// Path di sini relatif terhadap prefix /api/auth (lihat routes/index.js)
router.post('/register', validate({ body: registerSchema }), authController.register);
// Rate limiter dipasang paling depan: percobaan ke-11 langsung ditolak sebelum validasi
router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', authenticate, authController.me); // wajib login

module.exports = router;
