// Repository produk: semua SQL untuk tabel products ada di sini.
const { pool } = require('../config/database');

// ORDER BY tidak bisa memakai parameter ($1), jadi nilai sort dari user TIDAK
// pernah dimasukkan langsung ke SQL. User hanya memilih key, SQL-nya diambil dari
// daftar putih (whitelist) ini. `p.id` sebagai tie-breaker agar urutan stabil
// antar halaman ketika ada harga / created_at yang sama.
const SORT_SQL = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
};

// Bagian SELECT yang dipakai ulang oleh findAll dan findById.
// JOIN ke categories agar data kategori ikut terambil dalam satu query.
// p dan c = alias (nama pendek) untuk products dan categories.
const SELECT_PRODUCT = `
  SELECT
    p.id, p.sku, p.title, p.description, p.price, p.stock, p.image_url, p.created_at,
    c.id AS category_id, c.slug AS category_slug, c.name AS category_name
  FROM products p
  JOIN categories c ON c.id = p.category_id
`;

// Ubah baris datar hasil JOIN menjadi objek dengan kategori bersarang
function toProduct(row) {
  return {
    id: row.id,
    sku: row.sku,
    title: row.title,
    description: row.description,
    price: row.price,
    stock: row.stock,
    image_url: row.image_url,
    created_at: row.created_at,
    category: {
      id: row.category_id,
      slug: row.category_slug,
      name: row.category_name,
    },
  };
}

// Karakter % dan _ adalah wildcard di LIKE. Di-escape supaya pencarian "50%"
// mencari teks "50%" secara harfiah, bukan "50 diikuti apa saja".
function escapeLike(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Menyusun klausa WHERE secara dinamis, tetapi tetap aman:
 * nilai dari user selalu masuk lewat array `params` ($1, $2, ...),
 * yang digabung ke string SQL hanya placeholder-nya.
 */
function buildFilters({ q, category }) {
  const conditions = [];
  const params = [];

  // Contoh q="phone": params = ['%phone%'], conditions = ['p.title ILIKE $1']
  // ILIKE = LIKE yang tidak membedakan huruf besar/kecil. %...% = mengandung kata itu.
  // $${params.length} -> "$" + nomor urut parameter, jadi "$1", "$2", dst.
  if (q) {
    params.push(`%${escapeLike(q)}%`);
    conditions.push(`p.title ILIKE $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`c.slug = $${params.length}`);
  }

  // Tidak ada filter -> WHERE dikosongkan (semua produk)
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function findAll({ q, category, sort, limit, offset }) {
  const { where, params } = buildFilters({ q, category });
  const orderBy = SORT_SQL[sort] ?? SORT_SQL.newest; // ambil dari whitelist, default newest

  // LIMIT & OFFSET juga lewat parameter, nomornya melanjutkan params filter.
  // Belum di-await: query dijalankan dulu, ditunggu bersamaan di Promise.all di bawah.
  const dataQuery = pool.query(
    `${SELECT_PRODUCT}
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  // Hitung total dengan filter yang sama (tanpa LIMIT) untuk metadata pagination
  const countQuery = pool.query(
    `SELECT COUNT(*) AS total
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${where}`,
    params,
  );

  // Tunggu kedua query sekaligus (paralel), lebih cepat daripada satu per satu
  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  return {
    items: dataResult.rows.map(toProduct),
    total: countResult.rows[0].total,
  };
}

// Detail satu produk; null kalau tidak ada (service yang mengubahnya jadi 404)
async function findById(id) {
  const { rows } = await pool.query(`${SELECT_PRODUCT} WHERE p.id = $1`, [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}

// ---- Dipakai saat checkout (di dalam transaction, `db` = client transaksi) ----

/**
 * Mengambil produk sekaligus MENGUNCI barisnya (row lock / pessimistic locking).
 * Transaksi checkout lain yang ingin mengunci produk yang sama harus MENUNGGU
 * sampai transaksi ini COMMIT/ROLLBACK, lalu membaca stok terbaru.
 * -> dua checkout bersamaan tidak bisa sama-sama "melihat" stok lama, stok tidak minus.
 *
 * ORDER BY id: semua transaksi mengunci dengan urutan yang sama, mencegah deadlock
 * (A mengunci produk 1 lalu menunggu 2, sementara B mengunci 2 lalu menunggu 1).
 */
// `id = ANY($1::int[])` = id ada di dalam array, mis. [1, 6]. Satu query untuk banyak id.
// Parameter `db` default ke pool, tapi saat checkout diisi `client` transaksi.
async function findByIdsForUpdate(ids, db = pool) {
  const { rows } = await db.query(
    `SELECT id, title, price, stock
     FROM products
     WHERE id = ANY($1::int[])
     ORDER BY id
     FOR UPDATE`,
    [ids],
  );
  return rows;
}

// `stock = stock - $1` dihitung oleh database dari nilai terbaru (bukan nilai lama dari JS).
// Kalau hasilnya minus, CHECK (stock >= 0) menolak dan seluruh transaksi di-ROLLBACK.
async function decrementStock(id, quantity, db = pool) {
  await db.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, id]);
}

module.exports = { findAll, findById, findByIdsForUpdate, decrementStock };
