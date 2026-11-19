-- Tabel categories: pengelompokan produk (1 kategori punya banyak produk).
CREATE TABLE categories (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        VARCHAR(100) NOT NULL UNIQUE,         -- dipakai untuk filter ?category=slug
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
