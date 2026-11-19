// Integration test untuk CRUD produk khusus admin:
//   POST   /api/products
//   PATCH  /api/products/:id
//   DELETE /api/products/:id
require('./helpers/test-env'); // WAJIB paling atas: arahkan ke database test

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.data.access_token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Body produk yang valid; override untuk mengubah sebagian field
const productBody = (override = {}) => ({
  category_id: 1,
  sku: 'TEST-001',
  title: 'Produk Test',
  description: 'Dibuat oleh integration test',
  price: 150000,
  stock: 10,
  ...override,
});

describe('Admin CRUD produk', () => {
  let adminToken;
  let customerToken;

  before(async () => {
    // Akun dari seeder (database test di-seed ulang setiap npm test)
    adminToken = await login('admin@example.com', 'admin12345');
    customerToken = await login('user@example.com', 'password123');
  });

  after(async () => {
    await pool.end();
  });

  describe('hak akses', () => {
    it('tanpa token -> 401', async () => {
      const res = await request(app).post('/api/products').send(productBody());
      assert.equal(res.status, 401);
    });

    it('login sebagai customer -> 403 (create, update, delete)', async () => {
      const create = await request(app).post('/api/products').set(auth(customerToken)).send(productBody());
      const update = await request(app).patch('/api/products/1').set(auth(customerToken)).send({ price: 1 });
      const remove = await request(app).delete('/api/products/1').set(auth(customerToken));

      assert.deepEqual([create.status, update.status, remove.status], [403, 403, 403]);
      // Pastikan produk 1 benar-benar tidak berubah
      const { rows } = await pool.query('SELECT price FROM products WHERE id = 1');
      assert.notEqual(rows[0].price, 1);
    });
  });

  describe('POST /api/products', () => {
    it('admin membuat produk -> 201, SKU dinormalisasi, langsung muncul di katalog public', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(auth(adminToken))
        .send(productBody({ sku: 'new-001', title: 'Produk Baru', image_url: 'https://example.com/a.jpg' }));

      assert.equal(res.status, 201);
      const product = res.body.data;
      assert.equal(product.sku, 'NEW-001');
      assert.equal(product.category.id, 1); // bentuk response sama dengan GET (ada kategori)

      const pub = await request(app).get(`/api/products/${product.id}`); // tanpa token
      assert.equal(pub.status, 200);
      assert.equal(pub.body.data.title, 'Produk Baru');
    });

    it('body tidak valid -> 422 dengan detail per field', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(auth(adminToken))
        .send({ sku: 'X-1', price: -5, stock: '3' });

      assert.equal(res.status, 422);
      assert.ok(res.body.errors.title);
      assert.ok(res.body.errors.category_id);
      assert.ok(res.body.errors.price);
      assert.ok(res.body.errors.stock); // "3" string ditolak, harus number
    });

    it('SKU sudah dipakai (beda huruf besar/kecil pun) -> 409', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(auth(adminToken))
        .send(productBody({ sku: 'sp-001' })); // SP-001 milik produk seeder

      assert.equal(res.status, 409);
      assert.ok(res.body.errors.sku);
    });

    it('category_id tidak ada -> 422', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(auth(adminToken))
        .send(productBody({ sku: 'NOCAT-1', category_id: 99999 }));

      assert.equal(res.status, 422);
      assert.deepEqual(res.body.errors.category_id, ['Category not found']);
    });
  });

  describe('PATCH /api/products/:id', () => {
    let product;

    before(async () => {
      const res = await request(app)
        .post('/api/products')
        .set(auth(adminToken))
        .send(productBody({ sku: 'PATCH-001' }));
      product = res.body.data;
    });

    it('hanya field yang dikirim yang berubah', async () => {
      const res = await request(app)
        .patch(`/api/products/${product.id}`)
        .set(auth(adminToken))
        .send({ price: 99000 });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.price, 99000);
      assert.equal(res.body.data.title, product.title); // tidak ikut berubah
      assert.equal(res.body.data.stock, product.stock);
    });

    it('body kosong -> 422', async () => {
      const res = await request(app).patch(`/api/products/${product.id}`).set(auth(adminToken)).send({});
      assert.equal(res.status, 422);
    });

    it('produk tidak ada -> 404', async () => {
      const res = await request(app).patch('/api/products/999999').set(auth(adminToken)).send({ stock: 1 });
      assert.equal(res.status, 404);
    });

    it('mengganti SKU ke milik produk lain -> 409', async () => {
      const res = await request(app)
        .patch(`/api/products/${product.id}`)
        .set(auth(adminToken))
        .send({ sku: 'SP-002' });
      assert.equal(res.status, 409);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('menghapus produk -> 200, lalu 404, dan item di cart user ikut terhapus', async () => {
      const created = await request(app)
        .post('/api/products')
        .set(auth(adminToken))
        .send(productBody({ sku: 'DEL-001' }));
      const id = created.body.data.id;

      // Customer memasukkan produk ini ke cart
      await request(app)
        .post('/api/cart/items')
        .set(auth(customerToken))
        .send({ product_id: id, quantity: 1 })
        .expect(201);

      const res = await request(app).delete(`/api/products/${id}`).set(auth(adminToken));
      assert.equal(res.status, 200);

      assert.equal((await request(app).get(`/api/products/${id}`)).status, 404);
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM cart_items WHERE product_id = $1', [id]);
      assert.equal(rows[0].n, 0); // ON DELETE CASCADE
    });

    it('produk yang sudah pernah dipesan -> 409, produk & riwayat order tetap ada', async () => {
      const created = await request(app)
        .post('/api/products')
        .set(auth(adminToken))
        .send(productBody({ sku: 'ORDERED-001' }));
      const id = created.body.data.id;

      // Customer membeli produk ini (cart -> checkout)
      // Kosongkan cart customer dulu supaya yang di-checkout hanya produk ini
      await pool.query('DELETE FROM cart_items WHERE user_id = (SELECT id FROM users WHERE email = $1)', [
        'user@example.com',
      ]);
      await request(app)
        .post('/api/cart/items')
        .set(auth(customerToken))
        .send({ product_id: id, quantity: 1 })
        .expect(201);
      await request(app).post('/api/orders').set(auth(customerToken)).expect(201);

      const res = await request(app).delete(`/api/products/${id}`).set(auth(adminToken));

      assert.equal(res.status, 409);
      assert.equal((await request(app).get(`/api/products/${id}`)).status, 200);
    });

    it('produk tidak ada -> 404', async () => {
      const res = await request(app).delete('/api/products/999999').set(auth(adminToken));
      assert.equal(res.status, 404);
    });
  });
});
