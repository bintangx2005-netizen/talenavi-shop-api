// Skema validasi yang dipakai bersama oleh beberapa endpoint.
const { z } = require('zod');

// Batas atas tipe INTEGER di PostgreSQL. ID di atas ini akan membuat Postgres error
// "out of range" (jadi 500), jadi ditolak lebih awal sebagai error validasi.
const PG_INT_MAX = 2147483647;

// Validasi path parameter :id (mis. /products/:id, /cart/items/:id, /orders/:id)
// coerce: "/products/5" -> id "5" (string) diubah ke 5 (number); "/products/abc" ditolak
const idParamSchema = z.object({
  id: z.coerce
    .number({ error: 'ID must be a number' })
    .int('ID must be an integer')
    .positive('ID must be a positive integer')
    .max(PG_INT_MAX, 'ID is out of range'),
});

// Field pagination yang dipakai bersama (list produk, riwayat order).
// Query string selalu berupa string, jadi angka di-coerce (diubah) ke number.
const paginationShape = {
  page: z.coerce
    .number({ error: 'Page must be a number' })
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number({ error: 'Limit must be a number' })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit must be at most 50') // dibatasi agar client tidak bisa minta ribuan data sekaligus
    .default(10),
};

// paginationShape = objek biasa (bisa di-spread ke skema lain, lihat product.validator),
// paginationQuerySchema = skema siap pakai untuk endpoint yang hanya butuh page & limit.
const paginationQuerySchema = z.object(paginationShape);

module.exports = { idParamSchema, paginationShape, paginationQuerySchema, PG_INT_MAX };
