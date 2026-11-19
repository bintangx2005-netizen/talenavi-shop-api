// Entry point: menjalankan HTTP server.
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/database');

const server = app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});

// Tutup server dan koneksi DB dengan rapi saat proses dihentikan (Ctrl+C)
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    pool.end().then(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
