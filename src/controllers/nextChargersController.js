import * as nextChargersService from '../services/nextChargersService.js';

/**
 * GET /api/next-chargers — v7_1 + zelfde noise-filter als GPS-route; interne over-fetch zodat limit=5 gevuld blijft.
 */
export async function getNextChargers(req, res, next) {
  try {
    const { corridor_key, current_m, limit, mode, minLookaheadM } = req.validated;
    const data = await nextChargersService.getNextChargers(
      corridor_key,
      current_m,
      limit,
      mode,
      minLookaheadM
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}
