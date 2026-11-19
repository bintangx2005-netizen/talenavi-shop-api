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

app.use(helmet()); // header keamanan HTTP
app.use(cors());
app.use(express.json({ limit: '100kb' })); // parse body JSON, batasi ukuran

// Logging setiap request (dimatikan saat test supaya output bersih)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', routes);

// Harus paling akhir: 404 lalu error handler
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
