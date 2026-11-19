// Helper agar semua response sukses punya bentuk yang sama:
// { success: true, message, data, meta? }
function sendSuccess(res, { statusCode = 200, message = 'OK', data = null, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

// Bentuk response error: { success: false, message, errors? }
function sendError(res, { statusCode = 500, message = 'Internal server error', errors } = {}) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
