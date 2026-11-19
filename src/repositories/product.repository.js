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

  if (q) {
    params.push(`%${escapeLike(q)}%`);
    conditions.push(`p.title ILIKE $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`c.slug = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function findAll({ q, category, sort, limit, offset }) {
  const { where, params } = buildFilters({ q, category });
  const orderBy = SORT_SQL[sort] ?? SORT_SQL.newest;

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

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  return {
    items: dataResult.rows.map(toProduct),
    total: countResult.rows[0].total,
  };
}

async function findById(id) {
  const { rows } = await pool.query(`${SELECT_PRODUCT} WHERE p.id = $1`, [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}

module.exports = { findAll, findById };
