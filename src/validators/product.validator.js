const { z } = require('zod');
const { paginationShape } = require('./common.validator');

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
  q: optionalQueryString('Search query (q)', 100),
  category: optionalQueryString('Category', 100),
  sort: z
    .enum(SORT_OPTIONS, { error: `Sort must be one of: ${SORT_OPTIONS.join(', ')}` })
    .default('newest'),
});

module.exports = { listProductsQuerySchema, SORT_OPTIONS };
