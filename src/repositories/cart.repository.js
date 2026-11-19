const { pool } = require('../config/database');

// Semua query untuk satu item selalu memfilter `user_id` juga.
// Dengan begitu user tidak mungkin membaca/mengubah item milik user lain:
// item orang lain dianggap "tidak ada" (404).

const SELECT_CART_ITEM = `
  SELECT
    ci.id, ci.product_id, ci.quantity, ci.created_at,
    p.title, p.price, p.stock, p.image_url
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
`;

function toCartItem(row) {
  return {
    id: row.id,
    product_id: row.product_id,
    quantity: row.quantity,
    created_at: row.created_at,
    product: {
      id: row.product_id,
      title: row.title,
      price: row.price,
      stock: row.stock,
      image_url: row.image_url,
    },
  };
}

async function findAllByUser(userId) {
  const { rows } = await pool.query(
    `${SELECT_CART_ITEM}
     WHERE ci.user_id = $1
     ORDER BY ci.created_at ASC, ci.id ASC`,
    [userId],
  );
  return rows.map(toCartItem);
}

async function findByIdForUser(id, userId) {
  const { rows } = await pool.query(`${SELECT_CART_ITEM} WHERE ci.id = $1 AND ci.user_id = $2`, [
    id,
    userId,
  ]);
  return rows[0] ? toCartItem(rows[0]) : null;
}

async function findByUserAndProduct(userId, productId) {
  const { rows } = await pool.query(
    'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
    [userId, productId],
  );
  return rows[0] ?? null;
}

/**
 * Tambah produk ke cart dalam SATU query (upsert):
 * - belum ada -> INSERT baris baru
 * - sudah ada -> ON CONFLICT pada UNIQUE (user_id, product_id) -> quantity ditambah
 * Atomic, jadi dua request bersamaan tidak akan membuat baris dobel.
 */
async function addQuantity(userId, productId, quantity) {
  const { rows } = await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
     RETURNING id`,
    [userId, productId, quantity],
  );
  return rows[0].id;
}

async function updateQuantity(id, userId, quantity) {
  const { rowCount } = await pool.query(
    'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3',
    [quantity, id, userId],
  );
  return rowCount > 0;
}

async function deleteByIdForUser(id, userId) {
  const { rowCount } = await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return rowCount > 0;
}

module.exports = {
  findAllByUser,
  findByIdForUser,
  findByUserAndProduct,
  addQuantity,
  updateQuantity,
  deleteByIdForUser,
};
