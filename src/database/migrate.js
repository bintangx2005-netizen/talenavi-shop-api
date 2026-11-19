// Migration runner sederhana.
// - Membaca semua file .sql di folder migrations/ sesuai urutan nama (001_, 002_, ...)
// - Mencatat file yang sudah dijalankan di tabel schema_migrations
// - File yang sudah tercatat tidak dijalankan lagi, jadi aman dijalankan berulang kali
// - Setiap file dijalankan dalam transaction: kalau gagal, perubahan dibatalkan
const fs = require('fs');
const path = require('path');
const { pool, withTransaction } = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function main() {
  // Tabel pencatat: berisi nama file migration yang sudah pernah dijalankan
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name    VARCHAR(255) PRIMARY KEY,
      run_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const alreadyRun = new Set(rows.map((row) => row.name)); // Set = cek "sudah ada?" dengan cepat

  // Ambil semua file .sql, urutkan berdasarkan nama (makanya diberi awalan 001_, 002_, ...)
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  // Hanya file yang belum tercatat yang akan dijalankan
  const pending = files.filter((file) => !alreadyRun.has(file));

  if (pending.length === 0) {
    console.log('Tidak ada migration baru.');
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    // Jalankan SQL + catat namanya dalam SATU transaksi:
    // keduanya berhasil, atau keduanya batal (tidak ada setengah jadi)
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });

    console.log(`Migrated: ${file}`);
  }
}

main()
  .catch((err) => {
    console.error('Migration gagal:', err.message);
    process.exitCode = 1; // kode gagal, supaya `npm run db:setup` berhenti di sini
  })
  // Tutup pool di akhir, kalau tidak proses Node tidak akan selesai
  .finally(() => pool.end());
