const AppError = require('../utils/AppError');

/**
 * Mengubah error zod menjadi format { field: [pesan, ...] }
 * mis. { email: ['Invalid email format'], password: ['Password must be at least 8 characters'] }
 */
function formatZodErrors(zodError) {
  const errors = {};
  for (const issue of zodError.issues) {
    const field = issue.path.join('.') || '_body';
    if (!errors[field]) errors[field] = [];
    errors[field].push(issue.message);
  }
  return errors;
}

/**
 * Middleware validasi request yang reusable.
 * Pemakaian: validate({ body: registerSchema }) atau validate({ query: listSchema, params: idSchema })
 *
 * Hasil yang sudah divalidasi dan dibersihkan (trim, lowercase, default value, konversi
 * string -> number) disimpan di req.validated.body / .query / .params.
 * Controller sebaiknya membaca dari req.validated, bukan req.body mentah.
 */
function validate(schemas) {
  return (req, res, next) => {
    req.validated = {};
    const allErrors = {};

    for (const source of ['params', 'query', 'body']) {
      const schema = schemas[source];
      if (!schema) continue;

      // Di Express 5, req.body bernilai undefined kalau client tidak mengirim body JSON
      const result = schema.safeParse(req[source] ?? {});

      if (result.success) {
        req.validated[source] = result.data;
      } else {
        Object.assign(allErrors, formatZodErrors(result.error));
      }
    }

    if (Object.keys(allErrors).length > 0) {
      return next(AppError.validation(allErrors));
    }

    return next();
  };
}

module.exports = validate;
