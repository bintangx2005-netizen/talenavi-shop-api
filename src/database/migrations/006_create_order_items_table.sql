-- Tabel order_items: rincian barang di setiap order.
-- Judul & harga DISALIN (snapshot) dari products saat checkout, supaya kalau harga
-- produk berubah nanti, riwayat order lama tetap menunjukkan harga yang dibayar.
CREATE TABLE order_items (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- CASCADE: item tidak berarti tanpa order-nya
  order_id       INTEGER      NOT NULL REFERENCES orders (id)   ON DELETE CASCADE,
  -- RESTRICT: produk yang pernah dibeli tidak boleh dihapus
  product_id     INTEGER      NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  product_title  VARCHAR(200) NOT NULL,   -- snapshot judul saat checkout
  quantity       INTEGER      NOT NULL CHECK (quantity >= 1),
  price          INTEGER      NOT NULL CHECK (price >= 0)  -- snapshot harga saat checkout
);

-- Mempercepat pengambilan item untuk satu order (halaman Order Detail)
CREATE INDEX order_items_order_id_idx ON order_items (order_id);
