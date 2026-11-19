const AppError = require('../utils/AppError');
const { sendError } = require('../utils/response');

// Dipanggil kalau tidak ada route yang cocok
function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

// Global error handler. Express 5 otomatis meneruskan error dari handler async ke sini.
// Prinsip: client hanya melihat pesan yang aman. Stack trace dan pesan internal
// database hanya ditulis ke log server.
// Express mengenali error handler dari jumlah parameternya: HARUS 4 (err, req, res, next),
// walaupun `next` tidak dipakai.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Error yang memang kita lempar sendiri (404, 409, 422, ...)
  if (err instanceof AppError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  // Body JSON rusak, mis. {"email": }
  if (err.type === 'entity.parse.failed') {
    return sendError(res, { statusCode: 400, message: 'Invalid JSON body' });
  }

  // Body terlalu besar
  if (err.type === 'entity.too.large') {
    return sendError(res, { statusCode: 413, message: 'Request body too large' });
  }

  // Selain itu = error tak terduga -> log detailnya, kirim pesan umum
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  return sendError(res, { statusCode: 500, message: 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
