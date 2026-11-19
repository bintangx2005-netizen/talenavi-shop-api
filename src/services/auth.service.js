// Service = business logic. Tidak tahu soal req/res (HTTP), hanya menerima data
// dan mengembalikan hasil atau melempar AppError.
const bcrypt = require('bcrypt');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');

const PG_UNIQUE_VIOLATION = '23505';

async function register({ name, email, password }) {
  if (await userRepository.existsByEmail(email)) {
    throw AppError.conflict('Email is already registered', {
      email: ['Email is already registered'],
    });
  }

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

async function login({ email, password }) {
  const user = await userRepository.findByEmailWithPassword(email);

  // Pesan sengaja sama untuk "email tidak ada" dan "password salah",
  // supaya penyerang tidak bisa menebak email mana yang terdaftar.
  const isValid = user ? await bcrypt.compare(password, user.password) : false;
  if (!isValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const { password: _password, ...publicUser } = user;

  return {
    access_token: signToken(publicUser),
    token_type: 'Bearer',
    expires_in: env.JWT_EXPIRES_IN,
    user: publicUser,
  };
}

module.exports = { register, login };
