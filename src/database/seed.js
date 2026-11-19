// Seeder: mengisi kategori, produk, dan user test.
//
// Idempotent (aman dijalankan berulang kali) karena memakai
// INSERT ... ON CONFLICT pada kolom unik:
//   - categories.slug  -> nama kategori di-update
//   - products.sku     -> data produk di-update, KECUALI stok
//                         (stok adalah data runtime yang berubah karena checkout)
//   - users.email      -> dibiarkan (DO NOTHING), password tidak ditimpa
//
// Semua dijalankan dalam satu transaction: gagal sebagian = tidak ada yang tersimpan.
const bcrypt = require('bcrypt');
const { pool, withTransaction } = require('../config/database');
const env = require('../config/env');
const { categories, products, users } = require('./seeders/data');

async function seedCategories(client) {
  const slugToId = {};

  for (const category of categories) {
    const { rows } = await client.query(
      `INSERT INTO categories (slug, name)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, slug`,
      [category.slug, category.name],
    );
    slugToId[rows[0].slug] = rows[0].id;
  }

  return slugToId;
}

async function seedProducts(client, slugToId) {
  for (const product of products) {
    const categoryId = slugToId[product.category];
    if (!categoryId) {
      throw new Error(`Kategori "${product.category}" untuk produk ${product.sku} tidak ditemukan`);
    }

    await client.query(
      `INSERT INTO products (category_id, sku, title, description, price, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (sku) DO UPDATE SET
         category_id = EXCLUDED.category_id,
         title       = EXCLUDED.title,
         description = EXCLUDED.description,
         price       = EXCLUDED.price,
         image_url   = EXCLUDED.image_url`,
      [
        categoryId,
        product.sku,
        product.title,
        product.description,
        product.price,
        product.stock,
        `https://picsum.photos/seed/${product.sku.toLowerCase()}/600/400`,
      ],
    );
  }
}

async function seedUsers(client) {
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, env.BCRYPT_SALT_ROUNDS);

    await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ((LOWER(email))) DO NOTHING`,
      [user.name, user.email.toLowerCase(), hashedPassword, user.role],
    );
  }
}

async function main() {
  await withTransaction(async (client) => {
    const slugToId = await seedCategories(client);
    await seedProducts(client, slugToId);
    await seedUsers(client);
  });

  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM products)   AS products,
      (SELECT COUNT(*) FROM users)      AS users
  `);
  console.log('Seeding selesai:', rows[0]);
}

main()
  .catch((err) => {
    console.error('Seeding gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
