export function notFound(req, res) {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const duplicate = err.code === 'ER_DUP_ENTRY';
  const invalidReference = err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2';
  const uploadLimit = String(err.code || '').startsWith('LIMIT_');
  const status = Number(err.statusCode || err.status || (duplicate ? 409 : invalidReference || uploadLimit ? 400 : 500));
  if (status >= 500) console.error('[api error]', err);
  const safeMessage = duplicate ? 'A record with those details already exists.' : invalidReference ? 'That record is referenced by another item and cannot be changed.' : (err.message || 'Something went wrong.');
  res.status(status).json({ message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : safeMessage });
}

export function appError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
