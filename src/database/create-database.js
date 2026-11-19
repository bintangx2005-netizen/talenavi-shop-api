// Membuat database (nama dari DB_NAME) kalau belum ada.
// Konek ke database bawaan "postgres" karena database tujuan belum tentu ada.
const { Client } = require('pg');
const env = require('../config/env');

async function main() {
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: 'postgres',
  });
  await client.connect();

  try {
    // pg_database = katalog sistem PostgreSQL yang berisi daftar semua database
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      env.DB_NAME,
    ]);

    if (rowCount > 0) {
      console.log(`Database "${env.DB_NAME}" sudah ada.`);
      return;
    }

    // Nama database tidak bisa dikirim sebagai parameter ($1), jadi di-escape
    // sebagai identifier agar tetap aman.
    await client.query(`CREATE DATABASE ${client.escapeIdentifier(env.DB_NAME)}`);
    console.log(`Database "${env.DB_NAME}" berhasil dibuat.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Gagal membuat database:', err.message);
  process.exit(1);
});
