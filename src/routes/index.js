const { Router } = require('express');
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');

const router = Router();

// Health check: memastikan server dan koneksi database hidup
router.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  return sendSuccess(res, { message: 'Service is healthy', data: { database: 'connected' } });
});

// Route fitur akan didaftarkan di sini:
// router.use('/auth', authRoutes);
// router.use('/products', productRoutes);
// router.use('/categories', categoryRoutes);
// router.use('/cart', cartRoutes);
// router.use('/orders', orderRoutes);

module.exports = router;
