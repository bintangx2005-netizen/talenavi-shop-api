// Helper pagination berbasis LIMIT/OFFSET.
// LIMIT = berapa baris diambil, OFFSET = berapa baris dilewati dulu.

// Menghitung OFFSET untuk SQL: page 1 -> 0, page 2 -> limit, dst.
// Contoh limit 10: page 3 -> lewati 20 baris, ambil baris ke-21 s.d. 30.
function getOffset(page, limit) {
  return (page - 1) * limit;
}

// Metadata pagination yang dikirim di field "meta" pada response
function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit), // dibulatkan ke atas: 31 data / 10 = 4 halaman
  };
}

module.exports = { getOffset, buildPaginationMeta };
