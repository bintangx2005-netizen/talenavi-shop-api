const { z } = require('zod');

const SORT_OPTIONS = ['price_asc', 'price_desc', 'newest'];

// String opsional dari query: di-trim, dan string kosong (?q=) dianggap tidak dikirim
const optionalQueryString = (label, max) =>
  z
    .string({ error: `${label} must be a single string value` })
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((value) => (value ? value : undefined));

// Query string selalu berupa string, jadi angka di-coerce (diubah) ke number
const listProductsQuerySchema = z.object({
  page: z.coerce
    .number({ error: 'Page must be a number' })
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number({ error: 'Limit must be a number' })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit must be at most 50')
    .default(10),
  q: optionalQueryString('Search query (q)', 100),
  category: optionalQueryString('Category', 100),
  sort: z
    .enum(SORT_OPTIONS, { error: `Sort must be one of: ${SORT_OPTIONS.join(', ')}` })
    .default('newest'),
});

module.exports = { listProductsQuerySchema, SORT_OPTIONS };
