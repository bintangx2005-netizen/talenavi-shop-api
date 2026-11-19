const { Router } = require('express');
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');

const router = Router();

// Health check: memastikan server dan koneksi database hidup
router.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  return sendSuccess(res, { message: 'Service is healthy', data: { database: 'connected' } });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
// Route fitur berikutnya:
// router.use('/cart', cartRoutes);
// router.use('/orders', orderRoutes);

module.exports = router;
