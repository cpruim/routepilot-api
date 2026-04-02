import { validateMatchCorridorFromGpsParams } from '../utils/validation.js';

/**
 * Validates GET /api/match-corridor-from-gps query params.
 * On success sets req.validated = { lat, lon, heading, limit }.
 * On failure sends 400 and does not call next().
 */
export function validateMatchCorridorFromGps(req, res, next) {
  const result = validateMatchCorridorFromGpsParams(req.query);
  if (!result.valid) {
    return res.status(result.statusCode).json({ error: result.message });
  }
  req.validated = {
    lat: result.lat,
    lon: result.lon,
    heading: result.heading,
    limit: result.limit,
  };
  next();
}
