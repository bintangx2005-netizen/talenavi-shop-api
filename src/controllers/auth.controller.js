// Controller = penghubung HTTP <-> service.
// Tugasnya hanya: ambil input yang sudah divalidasi, panggil service, kirim response.
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
// Tidak ada try/catch: Express 5 otomatis meneruskan error dari fungsi async
// ke errorHandler, jadi controller tetap pendek.

// POST /api/auth/register -> 201 Created (resource baru dibuat)
async function register(req, res) {
  const user = await authService.register(req.validated.body);
  return sendSuccess(res, { statusCode: 201, message: 'User registered successfully', data: user });
}

// POST /api/auth/login -> 200 + access_token
async function login(req, res) {
  const result = await authService.login(req.validated.body);
  return sendSuccess(res, { message: 'Login successful', data: result });
}

// GET /api/auth/me -> profil user yang sedang login
async function me(req, res) {
  // req.user sudah diisi oleh middleware authenticate
  return sendSuccess(res, { data: req.user });
}

module.exports = { register, login, me };
