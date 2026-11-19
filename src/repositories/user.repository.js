// Repository = satu-satunya layer yang menulis SQL untuk tabel users.
// Semua query memakai parameter ($1, $2, ...) sehingga input user tidak pernah
// digabung langsung ke string SQL -> aman dari SQL injection.
const { pool } = require('../config/database');

// Kolom yang aman dikirim ke client (tanpa password)
const PUBLIC_COLUMNS = 'id, name, email, role, created_at';

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

// Mengembalikan juga hash password -> hanya untuk proses login, jangan dikirim ke client
async function findByEmailWithPassword(email) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, password FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  return rows[0] ?? null;
}

async function existsByEmail(email) {
  const { rowCount } = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [
    email,
  ]);
  return rowCount > 0;
}

async function create({ name, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash],
  );
  return rows[0];
}

module.exports = { findById, findByEmailWithPassword, existsByEmail, create };
