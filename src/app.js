// Menyusun aplikasi Express (middleware + routes), tanpa menjalankan server.
// Dipisah dari server.js agar app bisa di-import oleh test (supertest) tanpa membuka port.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middleware global: dijalankan berurutan untuk SETIAP request
app.use(helmet()); // header keamanan HTTP
app.use(cors()); // izinkan API dipanggil dari domain lain (mis. frontend)
app.use(express.json({ limit: '100kb' })); // parse body JSON ke req.body, batasi ukuran

// Logging setiap request (dimatikan saat test supaya output bersih)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Semua endpoint diawali /api (daftar lengkap ada di routes/index.js)
app.use('/api', routes);

// Harus paling akhir: 404 lalu error handler.
// notFoundHandler = tidak ada route yang cocok.
// errorHandler = menangkap semua error yang dilempar di controller/service/repository.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
