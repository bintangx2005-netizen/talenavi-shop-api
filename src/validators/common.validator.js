const { z } = require('zod');

// Batas atas tipe INTEGER di PostgreSQL. ID di atas ini akan membuat Postgres error
// "out of range" (jadi 500), jadi ditolak lebih awal sebagai error validasi.
const PG_INT_MAX = 2147483647;

// Validasi path parameter :id (mis. /products/:id, /cart/items/:id, /orders/:id)
const idParamSchema = z.object({
  id: z.coerce
    .number({ error: 'ID must be a number' })
    .int('ID must be an integer')
    .positive('ID must be a positive integer')
    .max(PG_INT_MAX, 'ID is out of range'),
});

module.exports = { idParamSchema, PG_INT_MAX };
