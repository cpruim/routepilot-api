import * as nextChargingLocationsService from '../services/nextChargingLocationsService.js';

/**
 * GET /api/next-charging-locations — public.rp_api_next_charging_locations_v1 met named args + p_bucket_size_m;
 * response: { data } met expliciete snake_case → camelCase mapping in de service.
 */
export async function getNextChargingLocations(req, res) {
  const { corridorKey, currentM, limit } = req.validated;
  console.log('[RP API] next-charging-locations params', { corridorKey, currentM, limit });

  try {
    const payload = await nextChargingLocationsService.getNextChargingLocations(
      corridorKey,
      currentM,
      limit
    );
    res.json(payload);
  } catch (err) {
    console.error('[RP API] next-charging-locations SQL error', {
      message: err?.message ?? String(err),
      code: err?.code,
      corridorKey,
      currentM,
      limit,
    });
    if (err?.stack) {
      console.error(err.stack);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch next charging locations',
    });
  }
}
