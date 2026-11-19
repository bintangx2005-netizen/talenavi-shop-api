// Menghitung OFFSET untuk SQL: page 1 -> 0, page 2 -> limit, dst.
function getOffset(page, limit) {
  return (page - 1) * limit;
}

// Metadata pagination yang dikirim di field "meta" pada response
function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };
}

module.exports = { getOffset, buildPaginationMeta };
