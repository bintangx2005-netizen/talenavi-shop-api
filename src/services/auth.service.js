// Service = business logic. Tidak tahu soal req/res (HTTP), hanya menerima data
// dan mengembalikan hasil atau melempar AppError.
const bcrypt = require('bcrypt');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');

// Kode error resmi PostgreSQL untuk "melanggar UNIQUE constraint/index"
const PG_UNIQUE_VIOLATION = '23505';

// REGISTER: cek email -> hash password -> simpan user. Mengembalikan user tanpa password.
async function register({ name, email, password }) {
  // Cek lebih dulu agar bisa memberi pesan 409 yang jelas
  if (await userRepository.existsByEmail(email)) {
    throw AppError.conflict('Email is already registered', {
      email: ['Email is already registered'],
    });
  }

  // bcrypt otomatis membuat salt acak, jadi password yang sama menghasilkan hash berbeda.
  // Hash bersifat satu arah: tidak bisa dikembalikan ke password asli.
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  try {
    return await userRepository.create({ name, email, passwordHash });
  } catch (err) {
    // Jaga-jaga race condition: dua request register dengan email sama di waktu bersamaan.
    // Pengecekan di atas bisa lolos keduanya, tapi unique index di DB tetap menolak salah satunya.
    if (err.code === PG_UNIQUE_VIOLATION) {
      throw AppError.conflict('Email is already registered', {
        email: ['Email is already registered'],
      });
    }
    throw err;
  }
}

// LOGIN: cari user -> bandingkan password dengan hash -> buat JWT.
async function login({ email, password }) {
  const user = await userRepository.findByEmailWithPassword(email);

  // Pesan sengaja sama untuk "email tidak ada" dan "password salah",
  // supaya penyerang tidak bisa menebak email mana yang terdaftar.
  // bcrypt.compare meng-hash password input dengan salt yang tersimpan di hash, lalu membandingkan
  const isValid = user ? await bcrypt.compare(password, user.password) : false;
  if (!isValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Destructuring: buang field password, sisanya (id, name, email, role...) masuk publicUser
  const { password: _password, ...publicUser } = user;

  return {
    access_token: signToken(publicUser),
    token_type: 'Bearer',
    expires_in: env.JWT_EXPIRES_IN,
    user: publicUser,
  };
}

module.exports = { register, login };
