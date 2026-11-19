const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { loginRateLimiter } = require('../middlewares/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = Router();

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
