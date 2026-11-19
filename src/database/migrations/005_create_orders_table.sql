-- Tabel orders: "kepala" pesanan (siapa, total, status). Rinciannya di order_items.
CREATE TABLE orders (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- RESTRICT: user yang punya riwayat order tidak boleh dihapus (data transaksi penting)
  user_id      INTEGER     NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  -- BIGINT karena total bisa melebihi batas INTEGER (±2,1 miliar Rupiah)
  total_price  BIGINT      NOT NULL CHECK (total_price >= 0),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Riwayat order per user, terbaru dulu.
-- Composite index (dua kolom) cocok dengan query: WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX orders_user_id_created_at_idx ON orders (user_id, created_at DESC);
