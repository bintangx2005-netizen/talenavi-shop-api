-- Tabel products: katalog barang yang dijual.
-- Harga disimpan INTEGER Rupiah (bukan FLOAT) agar tidak ada error pembulatan desimal.
CREATE TABLE products (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Foreign key ke categories. ON DELETE RESTRICT = kategori yang masih punya
  -- produk tidak boleh dihapus (mencegah produk "yatim").
  category_id  INTEGER      NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  sku          VARCHAR(50)  NOT NULL UNIQUE,         -- kode unik produk, kunci seeder idempotent
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL DEFAULT '',
  price        INTEGER      NOT NULL CHECK (price >= 0),   -- dalam Rupiah (tanpa desimal)
  stock        INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),  -- stok tidak boleh minus
  image_url    VARCHAR(500),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index untuk filter kategori dan sorting.
-- Index = "daftar isi" agar database tidak perlu membaca seluruh tabel (full scan).
CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_price_idx       ON products (price);
CREATE INDEX products_created_at_idx  ON products (created_at DESC);
