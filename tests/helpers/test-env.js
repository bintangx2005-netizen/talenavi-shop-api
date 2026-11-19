// Mengarahkan aplikasi ke DATABASE TEST, bukan database development.
// Harus di-require PALING AWAL (sebelum app / config), karena config/env.js
// membaca process.env saat pertama kali di-require.
//
// dotenv tidak menimpa variabel yang sudah ada di process.env, jadi nilai
// yang kita set di sini "menang" atas isi file .env.
require('dotenv').config({ quiet: true });

process.env.NODE_ENV = 'test'; // morgan (log request) dimatikan saat test
process.env.DB_NAME = process.env.TEST_DB_NAME || `${process.env.DB_NAME}_test`;
