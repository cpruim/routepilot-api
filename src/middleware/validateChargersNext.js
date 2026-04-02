import { validateNextChargersParams } from '../utils/validation.js';

/**
 * Validates GET /api/chargers/next query params.
 * On success sets req.validated = { corridor_key, current_m, limit }.
 * On failure sends 400 and does not call next().
 */
export function validateChargersNext(req, res, next) {
  const result = validateNextChargersParams(req.query);
  if (!result.valid) {
    return res.status(result.statusCode).json({ error: result.message });
  }
  req.validated = {
    corridor_key: result.corridor_key,
    current_m: result.current_m,
    limit: result.limit,
  };
  next();
}
