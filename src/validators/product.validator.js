// Validasi query string untuk GET /api/products
// contoh: ?page=2&limit=10&q=phone&category=smartphones&sort=price_asc
const { z } = require('zod');
const { paginationShape } = require('./common.validator');

// Nilai sort yang diizinkan. Harus sama dengan key SORT_SQL di product.repository.js
const SORT_OPTIONS = ['price_asc', 'price_desc', 'newest'];

// String opsional dari query: di-trim, dan string kosong (?q=) dianggap tidak dikirim
const optionalQueryString = (label, max) =>
  z
    .string({ error: `${label} must be a single string value` })
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((value) => (value ? value : undefined));

const listProductsQuerySchema = z.object({
  ...paginationShape, // page & limit
  q: optionalQueryString('Search query (q)', 100), // cari di judul produk
  category: optionalQueryString('Category', 100), // slug kategori, mis. "laptops"
  // enum = hanya boleh salah satu nilai di SORT_OPTIONS, selain itu 422
  sort: z
    .enum(SORT_OPTIONS, { error: `Sort must be one of: ${SORT_OPTIONS.join(', ')}` })
    .default('newest'),
});

module.exports = { listProductsQuerySchema, SORT_OPTIONS };
