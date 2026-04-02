import * as nextChargersService from '../services/nextChargersService.js';

/**
 * GET /api/next-chargers — public.rp_api_next_charging_locations_v5_8 (geen fallback naar oudere functies).
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
