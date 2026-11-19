const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');

/**
 * Middleware wajib login.
 * Membaca header "Authorization: Bearer <token>", memverifikasi JWT, lalu
 * memastikan user-nya masih ada di database. Hasilnya disimpan di req.user.
 * Semua kegagalan -> 401 Unauthorized.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    throw AppError.unauthorized('Authentication token is missing');
  }

  // "Bearer eyJhbGci..." dipecah menjadi ['Bearer', 'eyJhbGci...']
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw AppError.unauthorized('Authorization header must use the format: Bearer <token>');
  }

  let payload;
  try {
    // Cek signature (dibuat dengan JWT_SECRET kita?) dan masa berlaku (exp)
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Token has expired');
    }
    throw AppError.unauthorized('Invalid token');
  }

  // Token valid tapi user sudah dihapus -> tetap ditolak
  const user = await userRepository.findById(Number(payload.sub));
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }

  // Simpan user di req agar controller berikutnya tahu siapa yang login (req.user.id)
  req.user = user;
  return next();
}

/**
 * Middleware pembatas role, dipakai SETELAH authenticate.
 * Contoh: router.post('/', authenticate, authorize('admin'), handler)
 */
// Dipakai di product.routes.js untuk endpoint admin: authorize('admin').
// role dibaca dari req.user (diambil ulang dari DATABASE oleh authenticate), bukan dari
// token, jadi kalau role seseorang dicabut, aksesnya langsung hilang.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      throw AppError.forbidden('You do not have permission to access this resource');
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
