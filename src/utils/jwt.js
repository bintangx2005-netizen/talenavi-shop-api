const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ALGORITHM = 'HS256';

// Payload sengaja minimal: id user (sub) dan role. Jangan taruh data sensitif di JWT,
// karena payload JWT hanya di-encode base64, bukan dienkripsi.
function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Melempar TokenExpiredError / JsonWebTokenError kalau token tidak valid.
// `algorithms` dikunci agar token dengan algoritma lain (mis. "none") ditolak.
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
}

module.exports = { signToken, verifyToken };
