// Validator = "aturan" bentuk data yang boleh masuk (dipakai oleh middleware validate).
// Ditulis dengan zod: skema dibaca dari atas ke bawah, tiap method adalah satu aturan.
const { z } = require('zod');

// String wajib dengan pesan yang jelas: "X is required" kalau tidak dikirim,
// "X must be a string" kalau tipenya salah (mis. angka).
const requiredString = (label) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a string`),
  });

// Email dibersihkan dulu (hapus spasi, huruf kecil semua) baru dicek formatnya.
// .pipe() = setelah dibersihkan, teruskan hasilnya ke validasi format email.
const email = requiredString('Email')
  .trim()
  .toLowerCase()
  .max(255, 'Email must be at most 255 characters')
  .pipe(z.email('Invalid email format'));

const registerSchema = z.object({
  name: requiredString('Name')
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email,
  // Batas atas 72 karena bcrypt hanya memproses 72 byte pertama dari password
  password: requiredString('Password')
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

// Login tidak mengecek panjang minimal password: cukup "tidak kosong",
// benar/salahnya password diperiksa oleh bcrypt di service.
const loginSchema = z.object({
  email,
  password: requiredString('Password').min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
