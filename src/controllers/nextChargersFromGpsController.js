import * as nextChargersFromGpsService from '../services/nextChargersFromGpsService.js';

/**
 * GET /api/next-chargers-from-gps — één DB-call: rp_api_next_chargers_from_gps_v1.
 */
export async function getNextChargersFromGps(req, res) {
  const { lat, lon, heading, limit } = req.validated;

  try {
    const data = await nextChargersFromGpsService.getNextChargersFromGps(lat, lon, heading, limit);
    res.json(data);
  } catch (err) {
    console.error('[RP API] next-chargers-from-gps DB error', {
      message: err?.message ?? err,
      limit,
    });
    if (err?.stack) {
      console.error(err.stack);
    }
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch next chargers from GPS',
    });
  }
}
