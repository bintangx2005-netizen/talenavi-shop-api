const { z } = require('zod');

// String wajib dengan pesan yang jelas: "X is required" kalau tidak dikirim,
// "X must be a string" kalau tipenya salah (mis. angka).
const requiredString = (label) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a string`),
  });

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

const loginSchema = z.object({
  email,
  password: requiredString('Password').min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
