import { parseNextChargingLocationsQuery } from '../utils/parseNextChargingLocationsQuery.js';

/**
 * Validates GET /api/next-charging-locations query params.
 * Sets req.validated: corridorKey, currentM, limit (v7_1 DB-functie).
 */
export function validateNextChargingLocations(req, res, next) {
  const result = parseNextChargingLocationsQuery(req.query);
  if (!result.valid) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.message,
    });
  }
  req.validated = {
    corridorKey: result.corridorKey,
    currentM: result.currentM,
    limit: result.limit,
  };
  next();
}
