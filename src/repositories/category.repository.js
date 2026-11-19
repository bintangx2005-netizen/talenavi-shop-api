const { pool } = require('../config/database');

// Daftar kategori beserta jumlah produk di tiap kategori.
// LEFT JOIN agar kategori yang belum punya produk tetap muncul (product_count = 0).
async function findAll() {
  const { rows } = await pool.query(`
    SELECT c.id, c.slug, c.name, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `);
  return rows;
}

module.exports = { findAll };
