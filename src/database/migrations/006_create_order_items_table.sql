CREATE TABLE order_items (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id       INTEGER      NOT NULL REFERENCES orders (id)   ON DELETE CASCADE,
  product_id     INTEGER      NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  product_title  VARCHAR(200) NOT NULL,   -- snapshot judul saat checkout
  quantity       INTEGER      NOT NULL CHECK (quantity >= 1),
  price          INTEGER      NOT NULL CHECK (price >= 0)  -- snapshot harga saat checkout
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);
