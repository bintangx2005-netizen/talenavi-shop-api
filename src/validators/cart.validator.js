// Validasi body JSON untuk endpoint cart.
const { z } = require('zod');
const { PG_INT_MAX } = require('./common.validator');

// Body JSON sudah punya tipe, jadi TIDAK di-coerce: "2" (string) ditolak, harus 2 (number)
const positiveInt = (label) =>
  z
    .number({
      error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a number`),
    })
    .int(`${label} must be an integer`)
    .min(1, `${label} must be at least 1`)
    .max(PG_INT_MAX, `${label} is out of range`);

// POST /api/cart/items -> { "product_id": 1, "quantity": 2 }
// Di sini hanya dicek BENTUKNYA. Apakah produk ada & stok cukup dicek di cart.service
// (karena butuh data dari database).
const addCartItemSchema = z.object({
  product_id: positiveInt('Product ID'),
  quantity: positiveInt('Quantity'),
});

// PATCH /api/cart/items/:id -> { "quantity": 3 } (quantity baru, bukan tambahan)
const updateCartItemSchema = z.object({
  quantity: positiveInt('Quantity'),
});

module.exports = { addCartItemSchema, updateCartItemSchema };
