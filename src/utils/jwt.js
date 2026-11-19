// Helper JWT (JSON Web Token): membuat dan memeriksa token login.
// JWT = header.payload.signature. Signature dibuat dari JWT_SECRET, jadi token
// tidak bisa dipalsukan/diubah tanpa mengetahui secret tersebut.
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// HS256 = HMAC-SHA256: satu secret yang sama untuk membuat dan memverifikasi token
const ALGORITHM = 'HS256';

// Payload sengaja minimal: id user (sub) dan role. Jangan taruh data sensitif di JWT,
// karena payload JWT hanya di-encode base64, bukan dienkripsi.
// `sub` (subject) adalah nama field standar JWT untuk "token ini milik siapa".
// expiresIn menambahkan field `exp`, setelah waktu itu token otomatis ditolak.
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
