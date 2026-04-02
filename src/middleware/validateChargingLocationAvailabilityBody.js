/**
 * Valideert POST /api/charging-location-availability JSON-body.
 */
export function validateChargingLocationAvailabilityBody(req, res, next) {
  const body = req.body;
  if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      error: 'Request body must be a JSON object',
    });
  }

  if (!Object.prototype.hasOwnProperty.call(body, 'locationIds')) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: locationIds',
    });
  }

  const ids = body.locationIds;
  if (!Array.isArray(ids)) {
    return res.status(400).json({
      success: false,
      error: 'locationIds must be an array',
    });
  }

  const locationIds = ids.map((x) => String(x));
  req.validated = { locationIds };
  next();
}
