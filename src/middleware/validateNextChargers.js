import { validateNextChargersParams } from '../utils/validation.js';

/**
 * Validates GET /api/next-chargers query params.
 * On success sets req.validated = { corridor_key, current_m, limit, mode, minLookaheadM }.
 * On failure sends 400 and does not call next().
 */
export function validateNextChargers(req, res, next) {
  const result = validateNextChargersParams(req.query);
  if (!result.valid) {
    return res.status(result.statusCode).json({ error: result.message });
  }
  req.validated = {
    corridor_key: result.corridor_key,
    current_m: result.current_m,
    limit: result.limit,
    mode: result.mode,
    minLookaheadM: result.minLookaheadM,
  };
  next();
}
