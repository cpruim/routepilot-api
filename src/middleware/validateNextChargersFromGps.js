import { validateNextChargersFromGpsParams } from '../utils/validation.js';

/**
 * Validates GET /api/next-chargers-from-gps query params.
 * On success sets req.validated = { lat, lon, heading, limit }.
 */
export function validateNextChargersFromGps(req, res, next) {
  const result = validateNextChargersFromGpsParams(req.query);
  if (!result.valid) {
    return res.status(result.statusCode).json({
      ok: false,
      error: result.message,
    });
  }
  req.validated = {
    lat: result.lat,
    lon: result.lon,
    heading: result.heading,
    limit: result.limit,
  };
  next();
}
