-- Tabel cart_items: isi keranjang. Tidak ada tabel "carts" terpisah karena
-- setiap user hanya punya satu keranjang, jadi cukup dikaitkan langsung ke user_id.
CREATE TABLE cart_items (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- ON DELETE CASCADE = kalau user/produk dihapus, item keranjangnya ikut terhapus
  -- (isi keranjang hanya data sementara, tidak perlu disimpan).
  user_id     INTEGER     NOT NULL REFERENCES users (id)    ON DELETE CASCADE,
  product_id  INTEGER     NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  quantity    INTEGER     NOT NULL CHECK (quantity >= 1),  -- minimal 1; hapus item = DELETE
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu produk hanya boleh satu baris per user.
  -- Menambah produk yang sama = menambah quantity (ON CONFLICT ... DO UPDATE).
  CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id)
);
