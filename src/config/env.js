// Membaca file .env lalu memvalidasi isinya.
// Kalau ada variabel yang hilang/salah, aplikasi langsung berhenti saat start
// (fail fast) daripada error aneh di tengah jalan.
require('dotenv').config({ quiet: true });
const { z } = require('zod');

// Skema "bentuk" .env yang diharapkan.
// z.coerce.number() = ubah string dari .env (semua isi .env itu string) menjadi angka.
// .default(...) = nilai cadangan kalau variabel tidak diisi.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),

  // Secret pendek mudah ditebak (brute force), jadi dipaksa minimal 32 karakter
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),

  // Cost factor bcrypt: makin besar makin aman tapi makin lambat (10 = standar umum)
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

// safeParse tidak melempar error, tapi mengembalikan { success, data / error }
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Konfigurasi environment tidak valid:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

// File lain cukup `require('./env')` dan dapat konfigurasi yang sudah pasti valid
module.exports = parsed.data;
