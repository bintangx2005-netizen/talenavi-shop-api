// Integration test untuk CHECKOUT (POST /api/orders).
//
// "Integration" = yang diuji adalah alur nyata: request HTTP -> route -> middleware
// -> controller -> service -> repository -> PostgreSQL (database test), lalu hasilnya
// dicek lewat response DAN langsung ke database.
//
// Jalankan: npm test
require('./helpers/test-env'); // WAJIB paling atas: arahkan ke database test

const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

// ---------- Helper ----------

// Daftar + login lewat API, kembalikan { id, token }
async function createUser(name, email) {
  const password = 'password123';
  const reg = await request(app).post('/api/auth/register').send({ name, email, password });
  assert.equal(reg.status, 201, JSON.stringify(reg.body));

  const login = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(login.status, 200, JSON.stringify(login.body));

  return { id: reg.body.data.id, token: login.body.data.access_token };
}

// Ambil produk langsung dari DB berdasarkan SKU (id tidak di-hardcode)
async function getProduct(sku) {
  const { rows } = await pool.query('SELECT id, title, price, stock FROM products WHERE sku = $1', [sku]);
  return rows[0];
}

async function setStock(productId, stock) {
  await pool.query('UPDATE products SET stock = $1 WHERE id = $2', [stock, productId]);
}

async function countOrders(userId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM orders WHERE user_id = $1', [userId]);
  return rows[0].n;
}

async function countCartItems(userId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM cart_items WHERE user_id = $1', [userId]);
  return rows[0].n;
}

function addToCart(user, productId, quantity) {
  return request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ product_id: productId, quantity });
}

function checkout(user) {
  return request(app).post('/api/orders').set('Authorization', `Bearer ${user.token}`);
}

// ---------- Test ----------

describe('POST /api/orders (checkout)', () => {
  let alice;
  let bob;
  let phone; // SP-001 Nusa Phone X1
  let mini; // SP-005 Kirana Mini Phone

  before(async () => {
    alice = await createUser('Alice', 'alice@test.com');
    bob = await createUser('Bob', 'bob@test.com');
    phone = await getProduct('SP-001');
    mini = await getProduct('SP-005');
  });

  // Setiap test mulai dari kondisi yang sama: cart kosong, stok diketahui
  beforeEach(async () => {
    await pool.query('DELETE FROM cart_items WHERE user_id = ANY($1)', [[alice.id, bob.id]]);
    await setStock(phone.id, 10);
    await setStock(mini.id, 10);
  });

  after(async () => {
    await pool.end(); // tutup koneksi supaya proses test bisa selesai
  });

  it('berhasil: membuat order, mengurangi stok, dan mengosongkan cart', async () => {
    await addToCart(alice, phone.id, 2).expect(201);
    await addToCart(alice, mini.id, 1).expect(201);

    const res = await checkout(alice);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    const order = res.body.data;
    assert.equal(order.total_price, phone.price * 2 + mini.price * 1);
    assert.equal(order.items.length, 2);

    // Snapshot: judul & harga disalin ke order_items
    const phoneItem = order.items.find((i) => i.product_id === phone.id);
    assert.equal(phoneItem.product_title, phone.title);
    assert.equal(phoneItem.price, phone.price);
    assert.equal(phoneItem.subtotal, phone.price * 2);

    // Cek langsung ke database
    assert.equal((await getProduct('SP-001')).stock, 8);
    assert.equal((await getProduct('SP-005')).stock, 9);
    assert.equal(await countCartItems(alice.id), 0);
  });

  it('gagal 422 kalau cart kosong, dan tidak ada order yang dibuat', async () => {
    const before = await countOrders(alice.id);

    const res = await checkout(alice);

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.cart);
    assert.equal(await countOrders(alice.id), before);
  });

  it('gagal 409 kalau stok kurang, dan SEMUA perubahan di-rollback', async () => {
    await addToCart(alice, phone.id, 2).expect(201); // stok cukup
    await addToCart(alice, mini.id, 5).expect(201); // nanti dibuat kurang
    await setStock(mini.id, 3); // stok turun setelah masuk cart (mis. dibeli orang lain)
    const ordersBefore = await countOrders(alice.id);

    const res = await checkout(alice);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.errors.stock[0], /requested 5, available 3/);

    // Rollback: item yang stoknya cukup pun TIDAK ikut dikurangi
    assert.equal((await getProduct('SP-001')).stock, 10);
    assert.equal((await getProduct('SP-005')).stock, 3);
    assert.equal(await countOrders(alice.id), ordersBefore);
    assert.equal(await countCartItems(alice.id), 2); // cart tetap utuh
  });

  it('harga di order tidak berubah walau harga produk diubah setelah checkout', async () => {
    await addToCart(alice, phone.id, 1).expect(201);
    const { body } = await checkout(alice).expect(201);
    const orderId = body.data.id;

    // Harga produk naik setelah checkout
    await pool.query('UPDATE products SET price = price + 1000000 WHERE id = $1', [phone.id]);
    try {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${alice.token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.items[0].price, phone.price); // harga lama (snapshot)
      assert.equal(res.body.data.total_price, phone.price);
    } finally {
      await pool.query('UPDATE products SET price = $1 WHERE id = $2', [phone.price, phone.id]);
    }
  });

  it('race condition: checkout menunggu lock, lalu membaca stok TERBARU (409, stok tidak minus)', async () => {
    await setStock(phone.id, 3);
    await addToCart(bob, phone.id, 2).expect(201); // saat masuk cart stok masih 3, jadi lolos

    // Meniru "checkout orang lain yang sedang berjalan": buka transaksi sendiri
    // dan kunci baris produk dengan FOR UPDATE.
    const other = await pool.connect();
    try {
      await other.query('BEGIN');
      await other.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [phone.id]);

      // Checkout Bob dimulai, tapi harus MENUNGGU karena baris produk sedang dikunci
      let settled = false;
      const pending = checkout(bob).then((res) => {
        settled = true;
        return res;
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      assert.equal(settled, false, 'checkout seharusnya masih menunggu lock');

      // Transaksi lain membeli 2 unit lalu COMMIT -> lock dilepas, stok tinggal 1
      await other.query('UPDATE products SET stock = stock - 2 WHERE id = $1', [phone.id]);
      await other.query('COMMIT');

      // Bob lanjut dan membaca stok terbaru (1), bukan stok lama (3) -> 409 yang rapi.
      // Tanpa FOR UPDATE, Bob membaca stok lama 3, lolos validasi, lalu UPDATE-nya
      // membuat stok -1 -> ditolak CHECK constraint -> 500 (bukan 409).
      const res = await pending;
      assert.equal(res.status, 409);
      assert.match(res.body.errors.stock[0], /requested 2, available 1/);
      assert.equal((await getProduct('SP-001')).stock, 1);
      assert.equal(await countCartItems(bob.id), 1); // cart Bob tetap utuh
    } finally {
      other.release();
    }
  });

  it('dua checkout bersamaan untuk stok terbatas: tepat satu berhasil, stok tidak minus', async () => {
    await setStock(phone.id, 3);
    await addToCart(alice, phone.id, 2).expect(201);
    await addToCart(bob, phone.id, 2).expect(201);

    const results = await Promise.all([checkout(alice), checkout(bob)]);
    const statuses = results.map((r) => r.status).sort();

    assert.deepEqual(statuses, [201, 409]);
    assert.equal((await getProduct('SP-001')).stock, 1);
  });

  it('user lain tidak bisa melihat order milik orang lain (404)', async () => {
    await addToCart(alice, phone.id, 1).expect(201);
    const { body } = await checkout(alice).expect(201);

    const res = await request(app)
      .get(`/api/orders/${body.data.id}`)
      .set('Authorization', `Bearer ${bob.token}`);

    assert.equal(res.status, 404);
  });

  it('checkout tanpa token ditolak 401', async () => {
    const res = await request(app).post('/api/orders');
    assert.equal(res.status, 401);
  });
});
