import * as chargingLocationAvailabilityService from '../services/chargingLocationAvailabilityService.js';

/**
 * POST /api/charging-location-availability
 */
export async function postChargingLocationAvailability(req, res) {
  const { locationIds } = req.validated;
  console.log('[RP API] charging-location-availability', { count: locationIds.length });

  try {
    const data = await chargingLocationAvailabilityService.getChargingLocationAvailability(
      locationIds
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error('[RP API] charging-location-availability DB error', {
      message: err?.message ?? err,
      count: locationIds.length,
    });
    if (err?.stack) {
      console.error(err.stack);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charging location availability',
    });
  }
}
