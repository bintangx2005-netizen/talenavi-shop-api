// Repository order: SQL untuk tabel orders dan order_items.
const { pool } = require('../config/database');

// ---- Tulis (dipanggil di dalam transaction checkout, `db` = client transaksi) ----

// Buat "kepala" order. status tidak diisi -> DEFAULT 'pending'.
async function create({ userId, totalPrice }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO orders (user_id, total_price)
     VALUES ($1, $2)
     RETURNING id, user_id, total_price, status, created_at`,
    [userId, totalPrice],
  );
  return rows[0];
}

// price & product_title disalin dari produk saat checkout (snapshot),
// sehingga riwayat order tidak berubah walaupun produk diubah kemudian hari.
async function createItem({ orderId, productId, productTitle, quantity, price }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO order_items (order_id, product_id, product_title, quantity, price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, product_id, product_title, quantity, price`,
    [orderId, productId, productTitle, quantity, price],
  );
  return rows[0];
}

// ---- Baca (selalu difilter user_id: order orang lain dianggap tidak ada) ----

// Riwayat order + ringkasan tiap order:
// total_items = jumlah jenis produk, total_quantity = jumlah semua barang.
// COALESCE(SUM(...), 0) = kalau SUM bernilai NULL (tidak ada item), pakai 0.
// ::int = ubah hasil SUM (tipe bigint) ke integer.
async function findAllByUser(userId, { limit, offset }) {
  const dataQuery = pool.query(
    `SELECT
       o.id, o.total_price, o.status, o.created_at,
       COUNT(oi.id)                       AS total_items,
       COALESCE(SUM(oi.quantity), 0)::int AS total_quantity
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  const countQuery = pool.query('SELECT COUNT(*) AS total FROM orders WHERE user_id = $1', [
    userId,
  ]);

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
  return { items: dataResult.rows, total: countResult.rows[0].total };
}

// Detail order hanya kalau order itu milik user yang login
async function findByIdForUser(id, userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, total_price, status, created_at
     FROM orders
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ?? null;
}

// Item-item dalam satu order (dipanggil setelah kepemilikan order sudah dicek)
async function findItemsByOrderId(orderId) {
  const { rows } = await pool.query(
    `SELECT id, product_id, product_title, quantity, price
     FROM order_items
     WHERE order_id = $1
     ORDER BY id`,
    [orderId],
  );
  return rows;
}

module.exports = { create, createItem, findAllByUser, findByIdForUser, findItemsByOrderId };
