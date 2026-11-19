// Validasi query string untuk GET /api/products
// contoh: ?page=2&limit=10&q=phone&category=smartphones&sort=price_asc
const { z } = require('zod');
const { paginationShape, PG_INT_MAX } = require('./common.validator');

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

// ---------- Body untuk endpoint admin (POST / PATCH /api/products) ----------

// Angka bulat dari body JSON (tidak di-coerce: "100" string ditolak)
const intField = (label, min) =>
  z
    .number({
      error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a number`),
    })
    .int(`${label} must be an integer`)
    .min(min, `${label} must be at least ${min}`)
    .max(PG_INT_MAX, `${label} is out of range`);

const textField = (label, max) =>
  z
    .string({
      error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a string`),
    })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

// Field produk. Batas panjang mengikuti kolom di migration 003 (VARCHAR(50), VARCHAR(200), ...)
const productFields = {
  category_id: intField('Category ID', 1),
  // SKU dinormalisasi ke huruf besar: "sp-007" -> "SP-007", jadi tidak ada SKU kembar beda huruf
  sku: textField('SKU', 50)
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, 'SKU may only contain letters, numbers and dashes'),
  title: textField('Title', 200),
  description: z.string({ error: 'Description must be a string' }).trim().max(5000, 'Description is too long'),
  price: intField('Price', 0), // Rupiah, INTEGER, boleh 0 (sama dengan CHECK price >= 0)
  stock: intField('Stock', 0),
  // Hanya http/https (menolak mis. "javascript:..."). null = hapus gambar.
  image_url: z
    .url({ protocol: /^https?$/, error: 'Image URL must be a valid http(s) URL' })
    .max(500, 'Image URL is too long')
    .nullable(),
};

// POST: field wajib semua, kecuali description (default '') dan image_url (default null).
// Field lain di body (mis. "id", "created_at") otomatis dibuang oleh zod.
const createProductSchema = z.object({
  ...productFields,
  description: productFields.description.default(''),
  image_url: productFields.image_url.default(null),
});

// PATCH: semua field opsional (partial update), tapi minimal satu harus dikirim
const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided');

module.exports = { listProductsQuerySchema, createProductSchema, updateProductSchema, SORT_OPTIONS };
