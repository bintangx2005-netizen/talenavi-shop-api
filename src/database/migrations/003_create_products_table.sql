CREATE TABLE products (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id  INTEGER      NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  sku          VARCHAR(50)  NOT NULL UNIQUE,         -- kode unik produk, kunci seeder idempotent
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL DEFAULT '',
  price        INTEGER      NOT NULL CHECK (price >= 0),   -- dalam Rupiah (tanpa desimal)
  stock        INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),  -- stok tidak boleh minus
  image_url    VARCHAR(500),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index untuk filter kategori dan sorting
CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_price_idx       ON products (price);
CREATE INDEX products_created_at_idx  ON products (created_at DESC);
