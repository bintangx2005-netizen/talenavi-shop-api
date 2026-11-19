// Entry point: menjalankan HTTP server.
// Dipanggil oleh `npm start` / `npm run dev`.
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/database');

const server = app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});

// Tutup server dan koneksi DB dengan rapi saat proses dihentikan (Ctrl+C)
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  // 1) berhenti menerima request baru, tunggu request yang sedang jalan selesai
  server.close(() => {
    // 2) tutup semua koneksi database, 3) keluar dengan kode sukses
    pool.end().then(() => process.exit(0));
  });
}

// SIGINT = Ctrl+C di terminal, SIGTERM = dihentikan oleh sistem (mis. Docker)
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
