// Error yang "disengaja" (expected), mis. 404 produk tidak ada, 409 email sudah dipakai.
// Error jenis ini aman ditampilkan pesannya ke client.
// Error lain (bug, DB mati, dll) akan dianggap 500 dan pesannya disembunyikan.
//
// Cara pakai di service: `throw AppError.notFound('Product not found')`
// lalu errorHandler (middlewares/errorHandler.js) yang mengubahnya menjadi response JSON.
class AppError extends Error {
  // errors = detail per field (opsional), mis. { quantity: ['Only 2 left in stock'] }
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  // Static "factory method": jalan pintas agar tidak perlu menghafal angka status code.
  // 400 = request salah bentuk
  static badRequest(message = 'Bad request', errors) {
    return new AppError(400, message, errors);
  }

  // 401 = belum login / token tidak valid ("kamu siapa?")
  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message);
  }

  // 403 = sudah login tapi tidak punya hak akses ("kamu tidak boleh")
  static forbidden(message = 'Forbidden') {
    return new AppError(403, message);
  }

  // 404 = data tidak ditemukan (atau bukan milik user ini)
  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }

  // 409 = bentrok dengan kondisi data saat ini (email sudah dipakai, stok habis saat checkout)
  static conflict(message = 'Conflict', errors) {
    return new AppError(409, message, errors);
  }

  // 422 = bentuk request benar, tapi isinya tidak lolos aturan (validasi)
  static validation(errors, message = 'Validation failed') {
    return new AppError(422, message, errors);
  }
}

module.exports = AppError;
