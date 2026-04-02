import * as chargersNextService from '../services/chargersNextService.js';

/**
 * GET /api/chargers/next - Next chargers along corridor (v2, mobile nav JSON).
 * Query: corridor_key, current_m, limit. Validation in middleware.
 */
export async function getNextChargers(req, res, next) {
  try {
    const { corridor_key, current_m, limit } = req.validated;
    const data = await chargersNextService.getNextChargersV2(corridor_key, current_m, limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
