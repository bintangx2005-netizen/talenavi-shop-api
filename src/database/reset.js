// Menghapus SEMUA tabel (drop schema public) supaya database kembali kosong.
// Dipakai saat development, mis. untuk mengembalikan stok sebelum demo.
// Setelah ini jalankan migrate + seed lagi (script `npm run db:reset` sudah melakukannya).
const { pool } = require('../config/database');
const env = require('../config/env');

async function main() {
  if (env.NODE_ENV === 'production') {
    throw new Error('db:reset tidak boleh dijalankan di production');
  }

  await pool.query('DROP SCHEMA public CASCADE');
  await pool.query('CREATE SCHEMA public');
  console.log(`Semua tabel di database "${env.DB_NAME}" sudah dihapus.`);
}

main()
  .catch((err) => {
    console.error('Reset gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
