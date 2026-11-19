// Koneksi ke PostgreSQL memakai library `pg` (driver murni, tanpa ORM).
// Semua repository mengambil `pool` dari sini.
const { Pool, types } = require('pg');
const env = require('./env');

// Secara default `pg` mengembalikan BIGINT (mis. hasil COUNT(*) dan total_price)
// sebagai string supaya tidak kehilangan presisi. Nilai di aplikasi ini jauh di bawah
// Number.MAX_SAFE_INTEGER, jadi aman diubah ke number.
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));

// Pool = kumpulan koneksi yang dipakai ulang, lebih efisien daripada
// membuka koneksi baru di setiap request.
const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 10, // maksimal 10 koneksi bersamaan; request lain antre menunggu koneksi kosong
});

// Error pada koneksi yang sedang menganggur (mis. DB restart) dicatat agar app tidak crash
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Menjalankan `callback` di dalam satu database transaction.
 * - BEGIN di awal
 * - COMMIT kalau callback selesai tanpa error
 * - ROLLBACK kalau ada error, lalu error dilempar lagi ke pemanggil
 *
 * `client` yang diberikan ke callback WAJIB dipakai untuk semua query
 * di dalam transaksi (bukan `pool.query`), karena transaksi terikat ke satu koneksi.
 */
async function withTransaction(callback) {
  const client = await pool.connect(); // pinjam SATU koneksi khusus dari pool
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    // Selalu dikembalikan ke pool (sukses maupun gagal), kalau tidak koneksi "bocor"
    client.release();
  }
}

module.exports = { pool, withTransaction };
