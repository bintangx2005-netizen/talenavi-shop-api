// Menyiapkan database test dari nol sebelum test dijalankan:
// create (kalau belum ada) -> reset (hapus semua tabel) -> migrate -> seed.
// Memakai ulang script yang sama dengan development, hanya DB_NAME-nya yang berbeda.
require('./helpers/test-env');
const { execFileSync } = require('child_process');
const path = require('path');

const scripts = ['create-database.js', 'reset.js', 'migrate.js', 'seed.js'];

console.log(`Menyiapkan database test "${process.env.DB_NAME}"...`);
for (const script of scripts) {
  execFileSync(process.execPath, [path.join(__dirname, '..', 'src', 'database', script)], {
    env: process.env, // membawa DB_NAME & NODE_ENV versi test ke child process
    stdio: ['ignore', 'ignore', 'inherit'], // hanya tampilkan error
  });
}
console.log('Database test siap.\n');
