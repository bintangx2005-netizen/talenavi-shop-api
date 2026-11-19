CREATE TABLE orders (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER     NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  total_price  BIGINT      NOT NULL CHECK (total_price >= 0),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Riwayat order per user, terbaru dulu
CREATE INDEX orders_user_id_created_at_idx ON orders (user_id, created_at DESC);
