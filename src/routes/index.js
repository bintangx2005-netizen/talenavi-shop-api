const { Router } = require('express');
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');

const router = Router();

// Health check: memastikan server dan koneksi database hidup
router.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  return sendSuccess(res, { message: 'Service is healthy', data: { database: 'connected' } });
});

// Pembagian URL ke masing-masing file route (semua sudah diawali /api dari app.js):
//   /api/auth/*        -> register, login, me
//   /api/products/*    -> katalog (public)
//   /api/categories    -> daftar kategori (public)
//   /api/cart/*        -> keranjang (wajib login)
//   /api/orders/*      -> checkout & riwayat order (wajib login)
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
