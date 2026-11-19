// Menghapus SEMUA tabel (drop schema public) supaya database kembali kosong.
// Dipakai saat development, mis. untuk mengembalikan stok sebelum demo.
// Setelah ini jalankan migrate + seed lagi (script `npm run db:reset` sudah melakukannya).
const { pool } = require('../config/database');
const env = require('../config/env');

async function main() {
  // Pengaman: jangan sampai data asli terhapus
  if (env.NODE_ENV === 'production') {
    throw new Error('db:reset tidak boleh dijalankan di production');
  }

  // CASCADE = ikut hapus semua isi schema (tabel, index, constraint, schema_migrations)
  await pool.query('DROP SCHEMA public CASCADE');
  await pool.query('CREATE SCHEMA public'); // schema kosong yang siap diisi migration lagi
  console.log(`Semua tabel di database "${env.DB_NAME}" sudah dihapus.`);
}

main()
  .catch((err) => {
    console.error('Reset gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
