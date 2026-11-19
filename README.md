# Talenavi Shop API

REST API untuk toko online sederhana — **Product Catalog & Order API** (Technical Test Backend Intern Talenavi).
Mencakup autentikasi user, katalog produk (pagination, search, filter, sort), keranjang belanja, dan checkout pesanan dalam satu database transaction.

---

## Daftar Isi

1. [Tech Stack](#tech-stack)
2. [Alasan Pemilihan Stack & Database](#alasan-pemilihan-stack--database)
3. [Prasyarat](#prasyarat)
4. [Cara Install](#cara-install)
5. [Setup Database](#setup-database)
6. [Migration & Seeder](#migration--seeder)
7. [Menjalankan Aplikasi](#menjalankan-aplikasi)
8. [Dokumentasi API (Postman)](#dokumentasi-api-postman)
9. [Daftar Endpoint](#daftar-endpoint)
10. [Desain Database](#desain-database)
11. [Logic Checkout](#logic-checkout)
12. [Testing](#testing)
13. [Struktur Project](#struktur-project)
14. [Keamanan](#keamanan)
15. [Format Response](#format-response)

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Runtime | Node.js (diuji dengan v24) |
| Framework | Express 5 |
| Database | PostgreSQL (diuji dengan v16) |
| Driver DB | `pg` (node-postgres), SQL ditulis langsung tanpa ORM |
| Validasi | `zod` |
| Autentikasi | `jsonwebtoken` (JWT HS256) + `bcrypt` |
| Keamanan | `helmet`, `cors`, `express-rate-limit` |
| Logging | `morgan` |
| Dokumentasi API | Postman Collection + Environment |

## Alasan Pemilihan Stack & Database

Saya memilih **Node.js** dan **PostgreSQL** karena saya sudah familiar dengan keduanya, sehingga dapat fokus pada desain API dan business logic. Selain itu, keduanya cocok secara teknis untuk kebutuhan soal ini:

**PostgreSQL**
- **Transaction (ACID)** — checkout wajib berjalan *all-or-nothing*; PostgreSQL menjamin rollback penuh jika salah satu langkah gagal.
- **Row locking (`SELECT … FOR UPDATE`)** — mencegah dua checkout bersamaan membuat stok menjadi minus.
- **Constraint di level database** — `CHECK (stock >= 0)`, `CHECK (quantity >= 1)`, `UNIQUE`, dan `FOREIGN KEY` menjadi pengaman terakhir walaupun terjadi bug di kode.
- **`INSERT … ON CONFLICT`** — dipakai untuk seeder yang idempotent dan upsert item keranjang dalam satu query atomik.
- **`ILIKE` dan expression index** — pencarian judul tanpa membedakan huruf besar/kecil, serta email unik case-insensitive melalui index `LOWER(email)`.
- Dibanding **Supabase**: soal melarang penggunaan REST API bawaannya dan transaction multi-query harus lewat RPC; PostgreSQL langsung lebih sederhana dijalankan di localhost dengan kontrol penuh atas transaction.

**Node.js + Express 5**
- Ringan dan eksplisit (tidak banyak "magic"), sehingga setiap lapisan kode mudah dijelaskan.
- Express 5 otomatis meneruskan error dari handler `async` ke error handler global, jadi controller tetap ringkas tanpa `try/catch`.
- Driver `pg` tanpa ORM dipilih agar query (termasuk locking dan transaction) terlihat jelas dan terkendali.

## Prasyarat

- [Node.js](https://nodejs.org/) 18 atau lebih baru (disarankan versi LTS terbaru)
- [PostgreSQL](https://www.postgresql.org/download/) yang sudah berjalan di lokal
- [Postman](https://www.postman.com/downloads/) untuk mencoba API

## Cara Install

```bash
git clone https://github.com/bintangx2005-netizen/talenavi-shop-api.git
cd talenavi-shop-api
npm install
```

Salin file environment lalu isi nilainya:

```bash
cp .env.example .env
```

| Variabel | Keterangan |
|---|---|
| `PORT` | Port server (default `3000`) |
| `NODE_ENV` | `development` / `production` / `test` |
| `DB_HOST`, `DB_PORT` | Alamat PostgreSQL (default `localhost:5432`) |
| `DB_USER`, `DB_PASSWORD` | Kredensial PostgreSQL |
| `DB_NAME` | Nama database (default `talenavi_shop`) |
| `JWT_SECRET` | String acak **minimal 32 karakter** |
| `JWT_EXPIRES_IN` | Masa berlaku token (default `1d`) |
| `BCRYPT_SALT_ROUNDS` | Cost factor bcrypt (default `10`) |

Contoh membuat `JWT_SECRET` acak:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Konfigurasi divalidasi saat aplikasi start (`src/config/env.js`). Jika ada variabel yang hilang atau tidak valid, aplikasi langsung berhenti dengan pesan yang jelas.

## Setup Database

Pastikan PostgreSQL berjalan dan kredensial di `.env` sudah benar, lalu jalankan:

```bash
npm run db:setup
```

Perintah ini menjalankan tiga langkah berurutan:

1. `db:create` — membuat database `DB_NAME` jika belum ada
2. `db:migrate` — membuat seluruh tabel
3. `db:seed` — mengisi data awal

## Migration & Seeder

| Perintah | Fungsi |
|---|---|
| `npm run db:migrate` | Menjalankan file `.sql` di `src/database/migrations/` yang belum pernah dijalankan (dicatat di tabel `schema_migrations`). Setiap file berjalan dalam transaction. |
| `npm run db:seed` | Mengisi 5 kategori, 30 produk, dan 2 user. **Idempotent** — aman dijalankan berulang kali tanpa data duplikat (`INSERT … ON CONFLICT`). |
| `npm run db:reset` | Menghapus semua tabel lalu menjalankan migration + seeder lagi (data kembali bersih). Diblokir jika `NODE_ENV=production`. |

**Akun untuk testing (dari seeder):**

| Email | Password | Role |
|---|---|---|
| `user@example.com` | `password123` | customer |
| `admin@example.com` | `admin12345` | admin |

Data seeder: 5 kategori (Smartphones, Laptops, Audio, Fashion, Home Appliances) dengan masing-masing 6 produk. Produk **Kirana Fold** (id 6) sengaja diberi stok 2 untuk mendemokan skenario stok tidak mencukupi.

## Menjalankan Aplikasi

```bash
# development (auto-restart saat file berubah)
npm run dev

# production
npm start
```

Server berjalan di `http://localhost:3000`. Cek kesehatan server dan koneksi database:

```bash
curl http://localhost:3000/api/health
```

## Dokumentasi API (Postman)

File dokumentasi ada di folder [`docs/postman/`](docs/postman/):

- `talenavi-shop-api.postman_collection.json` — seluruh endpoint, dikelompokkan per fitur (Auth, Products, Admin - Products, Cart, Orders, Health), lengkap dengan deskripsi, contoh request, dan contoh response sukses maupun error.
- `talenavi-shop-api.postman_environment.json` — variabel `base_url` (default `http://localhost:3000`), `token`, `admin_token`, dan lainnya.

**Cara membuka:**

1. Buka Postman → **Import** → pilih kedua file di atas.
2. Pilih environment **Talenavi Shop API - Local** di pojok kanan atas.
3. Jalankan server (`npm run dev`).
4. Kirim **Auth → Login**. Token otomatis tersimpan ke variabel `{{token}}` dan dipakai oleh semua endpoint yang membutuhkan login.

Contoh response pada setiap request dapat dilihat dengan membuka bagian **Examples** di bawah request tersebut.

**Alur demo:** Register → Login → List Products → Product Detail → Add Item to Cart → Get Cart → Checkout → Order History → Order Detail.

**Endpoint admin:** kirim **Auth → Login (Admin)**. Token admin disimpan ke `{{admin_token}}` (terpisah dari `{{token}}` customer) dan otomatis dipakai folder **Admin - Products** (Create → Update → Delete).

## Daftar Endpoint

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Login | Keterangan |
|---|---|:---:|---|
| POST | `/auth/register` | | Registrasi user baru |
| POST | `/auth/login` | | Login, mengembalikan JWT (dibatasi 10 percobaan / 15 menit per IP) |
| GET | `/auth/me` | ✔ | Data user yang sedang login |
| GET | `/products` | | List produk (pagination, search, filter, sort) |
| GET | `/products/:id` | | Detail produk |
| POST | `/products` | Admin | Tambah produk baru |
| PATCH | `/products/:id` | Admin | Ubah sebagian data produk (harga, stok, dll.) |
| DELETE | `/products/:id` | Admin | Hapus produk (ditolak jika sudah punya riwayat order) |
| GET | `/categories` | | Daftar kategori beserta jumlah produk |
| GET | `/cart` | ✔ | Isi keranjang, subtotal per item, dan total harga |
| POST | `/cart/items` | ✔ | Tambah produk ke keranjang |
| PATCH | `/cart/items/:id` | ✔ | Ubah quantity item |
| DELETE | `/cart/items/:id` | ✔ | Hapus item dari keranjang |
| POST | `/orders` | ✔ | Checkout seluruh isi keranjang |
| GET | `/orders` | ✔ | Riwayat order milik user |
| GET | `/orders/:id` | ✔ | Detail order beserta item-itemnya |
| GET | `/health` | | Status server dan database |

Endpoint bertanda ✔ membutuhkan header `Authorization: Bearer <token>`. Endpoint bertanda **Admin** membutuhkan token dari akun ber-role `admin`.

**Admin vs customer:** keduanya login di endpoint yang sama (`POST /auth/login`); yang membedakan adalah kolom `role` di tabel `users`. Route admin dijaga dua middleware berurutan: `authenticate` (tanpa token / token tidak valid → `401`) lalu `authorize('admin')` (login tetapi bukan admin → `403`). Role dibaca ulang dari database di setiap request, bukan dari token, sehingga pencabutan role langsung berlaku. Registrasi selalu menghasilkan role `customer`; akun admin hanya dibuat lewat seeder/database.

**Body `POST /products`** (pada `PATCH` semua field opsional, minimal satu):

| Field | Aturan |
|---|---|
| `category_id` | integer, wajib, kategori harus ada (jika tidak → `422`) |
| `sku` | wajib, unik (jika sudah dipakai → `409`), huruf/angka/strip, otomatis huruf besar |
| `title` | wajib, maks 200 karakter |
| `description` | opsional, default `""` |
| `price`, `stock` | integer ≥ 0 |
| `image_url` | opsional, URL http(s) atau `null` |

Menghapus produk ikut menghapus produk tersebut dari keranjang user (`ON DELETE CASCADE`). Produk yang sudah pernah dipesan tidak bisa dihapus (`409`) agar riwayat order tetap utuh; untuk berhenti menjualnya, set `stock` ke 0.

**Query parameter `GET /products`:**

| Parameter | Keterangan | Default |
|---|---|---|
| `page` | Nomor halaman (≥ 1) | `1` |
| `limit` | Jumlah data per halaman (1–50) | `10` |
| `q` | Pencarian berdasarkan judul produk | – |
| `category` | Filter berdasarkan slug kategori | – |
| `sort` | `price_asc`, `price_desc`, atau `newest` | `newest` |

Contoh: `/api/products?q=phone&category=smartphones&sort=price_asc&page=1`

**Status code yang digunakan:**

| Kode | Kapan |
|---|---|
| 200 / 201 | Berhasil / resource baru dibuat |
| 400 | Body JSON tidak valid |
| 401 | Token tidak ada, tidak valid, kedaluwarsa, atau login gagal |
| 403 | Sudah login tetapi bukan admin (endpoint admin) |
| 404 | Data tidak ditemukan (termasuk data milik user lain) |
| 409 | Email / SKU sudah dipakai, stok tidak mencukupi saat checkout, produk yang punya riwayat order dihapus |
| 422 | Validasi gagal, quantity melebihi stok, keranjang kosong |
| 429 | Terlalu banyak percobaan login |
| 500 | Error internal (detail hanya dicatat di log server) |

## Desain Database

```
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ users           │           │ cart_items      │           │ products        │
├─────────────────┤           ├─────────────────┤           ├─────────────────┤
│ id           PK │ 1       N │ id           PK │  CASCADE  │ id           PK │
│ name            │──────────>│ user_id      FK │ N       1 │ category_id  FK │
│ email   UNIQUE* │ CASCADE   │ product_id   FK │<──────────│ sku      UNIQUE │
│ password (hash) │           │ quantity   (≥1) │           │ title           │
│ role            │           │ UNIQUE**        │     ┌─────│ price      (≥0) │
└─────────────────┘           └─────────────────┘     │  1  │ stock      (≥0) │
        │ 1                                           │     └─────────────────┘
        │ RESTRICT                                    │             ^ N
        │ N                                           │             │ RESTRICT
        v                                             │ RESTRICT    │ 1
┌─────────────────┐           ┌─────────────────┐     │     ┌─────────────────┐
│ orders          │           │ order_items     │     │     │ categories      │
├─────────────────┤           ├─────────────────┤     │     ├─────────────────┤
│ id           PK │ 1       N │ id           PK │     │     │ id           PK │
│ user_id      FK │──────────>│ order_id     FK │  N  │     │ slug     UNIQUE │
│ total_price     │ CASCADE   │ product_id   FK │<────┘     │ name            │
│   (BIGINT)      │           │ product_title[S]│           └─────────────────┘
│ status          │           │ price       [S] │
└─────────────────┘           │ quantity   (≥1) │
                              └─────────────────┘

Panah: dari sisi 1 ke sisi N  ·  [S] = snapshot (disalin dari products saat checkout)
*  UNIQUE index pada LOWER(email) → User@Mail.com dianggap sama dengan user@mail.com
** UNIQUE (user_id, product_id) → satu produk hanya satu baris per user
```

Semua tabel juga memiliki kolom `created_at` (`TIMESTAMPTZ`); kolom `products.description` dan `products.image_url` tidak ditampilkan di diagram agar ringkas.

**Keputusan desain:**

| Keputusan | Alasan |
|---|---|
| `order_items.price` dan `product_title` disalin saat checkout | Riwayat order tetap menunjukkan harga yang dibayar walaupun harga/judul produk berubah kemudian. |
| Keranjang tidak menyimpan harga | Sebelum checkout, user selalu melihat harga terbaru (JOIN ke `products`). |
| `UNIQUE (user_id, product_id)` pada `cart_items` | Menambah produk yang sama menambah quantity (upsert), bukan membuat baris baru. |
| Harga `INTEGER` (Rupiah), `total_price` `BIGINT` | Menghindari error pembulatan desimal; total bisa melebihi batas `INTEGER`. |
| `CHECK (stock >= 0)` | Pengaman terakhir agar stok tidak pernah minus. |
| `ON DELETE RESTRICT` pada `users → orders`, `products → order_items`, `categories → products` | Data transaksi dan relasi penting tidak boleh hilang. |
| `ON DELETE CASCADE` pada `cart_items` dan `orders → order_items` | Data turunan ikut terhapus bersama induknya. |
| `products.sku UNIQUE`, `categories.slug UNIQUE` | Kunci untuk seeder idempotent dan filter kategori. |
| Index `products(category_id)`, `products(price)`, `products(created_at DESC)`, `orders(user_id, created_at DESC)` | Mempercepat filter, sorting, dan riwayat order. |

## Logic Checkout

`POST /api/orders` (implementasi: [`src/services/order.service.js`](src/services/order.service.js)) — seluruh langkah berjalan dalam **satu database transaction**:

1. Ambil dan **kunci** isi keranjang user (`FOR UPDATE`). Keranjang kosong → `422`.
2. Ambil dan **kunci** baris produk terkait (`SELECT … ORDER BY id FOR UPDATE`).
3. Validasi stok semua item. Jika ada yang kurang → `409` dengan daftar produk yang stoknya tidak cukup.
4. Hitung total dari harga di database (bukan dari input client).
5. Buat `orders` dan `order_items` (harga & judul disimpan sebagai snapshot).
6. Kurangi stok produk.
7. Kosongkan keranjang.
8. `COMMIT`. Jika terjadi error di langkah mana pun → `ROLLBACK`, tidak ada data yang berubah.

**Penanganan checkout bersamaan:** karena baris produk dikunci, checkout lain untuk produk yang sama menunggu hingga transaksi pertama selesai, lalu membaca stok terbaru. Dengan stok 1 dan dua checkout bersamaan, hasilnya satu `201` dan satu `409`, stok tidak pernah minus. Penguncian dilakukan berurutan berdasarkan `id` untuk mencegah deadlock.

Contoh response stok tidak mencukupi:

```json
{
  "success": false,
  "message": "Insufficient stock for some products",
  "errors": {
    "stock": ["\"Kirana Fold\" (product_id 6): requested 2, available 1"]
  }
}
```

## Testing

Integration test untuk checkout dan CRUD produk admin memakai test runner bawaan Node (`node:test`) dan [`supertest`](https://github.com/ladjs/supertest). Request dikirim ke `app` (tanpa membuka port), melewati seluruh layer sampai PostgreSQL, lalu hasilnya dicek dari response **dan** langsung dari database.

```bash
npm test
```

Test memakai **database terpisah** bernama `<DB_NAME>_test` (mis. `talenavi_shop_test`, bisa diganti lewat env `TEST_DB_NAME`). Database ini dibuat, dikosongkan, lalu di-migrate dan di-seed ulang setiap kali `npm test` dijalankan, sehingga data development tidak tersentuh.

| Skenario ([`tests/checkout.test.js`](tests/checkout.test.js)) | Yang diverifikasi |
|---|---|
| Checkout berhasil | `201`, total benar, snapshot judul/harga, stok berkurang, keranjang kosong |
| Keranjang kosong | `422`, tidak ada order dibuat |
| Stok kurang | `409` dengan detail produk; **rollback**: stok, order, dan keranjang tidak berubah |
| Harga produk berubah setelah checkout | Detail order tetap memakai harga snapshot |
| Race condition (row lock) | Checkout **menunggu** baris produk yang sedang dikunci transaksi lain, lalu membaca stok terbaru → `409`, stok tidak minus |
| Dua checkout bersamaan | Tepat satu `201` dan satu `409` |
| Order milik user lain / tanpa token | `404` / `401` |

| Skenario ([`tests/admin-products.test.js`](tests/admin-products.test.js)) | Yang diverifikasi |
|---|---|
| Hak akses | Tanpa token `401`; customer `403` untuk create/update/delete (data tidak berubah) |
| Create | `201`, SKU dinormalisasi huruf besar, langsung tampil di katalog public; validasi `422`; SKU kembar `409`; kategori tidak ada `422` |
| Update | Hanya field yang dikirim yang berubah; body kosong `422`; produk tidak ada `404`; SKU kembar `409` |
| Delete | `200` dan item di keranjang ikut terhapus; produk yang punya riwayat order `409`; produk tidak ada `404` |

Test race condition bersifat deterministik: test membuka transaksi sendiri yang mengunci baris produk, lalu memastikan checkout tertahan. Jika `FOR UPDATE` dihapus dari repository, test ini gagal (checkout membaca stok lama dan berakhir `500` karena CHECK constraint).

## Struktur Project

```
src/
├── server.js          # Entry point: menjalankan server + graceful shutdown
├── app.js             # Setup Express: middleware global, routes, error handler
├── config/            # env.js (validasi .env), database.js (pool + withTransaction)
├── database/          # migrations/, seeders/, migrate.js, seed.js, reset.js, create-database.js
├── routes/            # Pemetaan URL → middleware → controller
├── middlewares/       # auth (JWT), validate (zod), rateLimiter, errorHandler
├── validators/        # Skema validasi input
├── controllers/       # Menerima request, memanggil service, mengirim response
├── services/          # Business logic (aturan cart, checkout, auth)
├── repositories/      # Query SQL ke PostgreSQL
└── utils/             # AppError, response helper, jwt, pagination
tests/
├── helpers/test-env.js  # Mengarahkan aplikasi ke database test
├── setup-test-db.js     # create → reset → migrate → seed database test
├── checkout.test.js     # Integration test checkout
└── admin-products.test.js # Integration test CRUD produk admin
```

Alur request: `routes → middlewares → controller → service → repository → database`. Controller tidak menulis SQL, repository tidak mengetahui HTTP.

## Keamanan

- Password di-hash dengan **bcrypt**, tidak pernah dikembalikan di response.
- **JWT** dengan masa berlaku; algoritma dikunci ke HS256 saat verifikasi. Middleware juga memastikan user pemilik token masih ada.
- Login mengembalikan pesan yang sama untuk email tidak terdaftar maupun password salah (mencegah *user enumeration*), dan dibatasi **rate limit**.
- Semua query memakai **parameterized query** (`$1, $2, …`); nilai `sort` dipetakan melalui whitelist → aman dari SQL injection.
- **Otorisasi data:** query cart dan order selalu memfilter `user_id` dari token; data milik user lain menghasilkan `404`.
- Semua input divalidasi dengan **zod**; error internal tidak pernah ditampilkan ke client (hanya dicatat di log server).
- Secret disimpan di `.env` (tidak di-commit); tersedia `.env.example`.
- Header keamanan HTTP dengan **helmet** dan batas ukuran body 100kb.

## Format Response

Sukses:

```json
{
  "success": true,
  "message": "OK",
  "data": [ ],
  "meta": { "page": 1, "limit": 10, "total": 30, "total_pages": 3 }
}
```

`meta` hanya ada pada endpoint list (produk dan riwayat order).

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}
```
