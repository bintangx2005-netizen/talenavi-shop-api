// Error yang "disengaja" (expected), mis. 404 produk tidak ada, 409 email sudah dipakai.
// Error jenis ini aman ditampilkan pesannya ke client.
// Error lain (bug, DB mati, dll) akan dianggap 500 dan pesannya disembunyikan.
class AppError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message = 'Bad request', errors) {
    return new AppError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }

  static conflict(message = 'Conflict', errors) {
    return new AppError(409, message, errors);
  }

  static validation(errors, message = 'Validation failed') {
    return new AppError(422, message, errors);
  }
}

module.exports = AppError;
