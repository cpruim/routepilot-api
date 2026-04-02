/**
 * Centralized error handler. Logs and returns JSON.
 */
export function errorHandler(err, req, res, next) {
  console.error('[RP API error]', err.message);
  if (err.stack) {
    console.error(err.stack);
  }

  const code = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(code).json({
    error: code >= 500 ? 'Internal server error' : (err.message || 'Unknown error'),
  });
}
