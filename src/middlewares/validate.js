const AppError = require('../utils/AppError');

/**
 * Mengubah error zod menjadi format { field: [pesan, ...] }
 * mis. { email: ['Invalid email format'], password: ['Password must be at least 8 characters'] }
 */
function formatZodErrors(zodError) {
  const errors = {};
  for (const issue of zodError.issues) {
    // path = lokasi field yang salah, mis. ['email'] -> 'email'
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
// validate() adalah "middleware factory": fungsi yang MENGEMBALIKAN middleware,
// sehingga satu kode bisa dipakai ulang dengan skema yang berbeda di tiap route.
function validate(schemas) {
  return (req, res, next) => {
    req.validated = {};
    const allErrors = {}; // kumpulkan SEMUA error dulu, supaya client tahu semua kesalahannya sekaligus

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

    // Ada error -> berhenti di sini, controller tidak dijalankan (422)
    if (Object.keys(allErrors).length > 0) {
      return next(AppError.validation(allErrors));
    }

    return next(); // semua valid -> lanjut ke controller
  };
}

module.exports = validate;
