import * as matchCorridorFromGpsService from '../services/matchCorridorFromGpsService.js';

/**
 * GET /api/match-corridor-from-gps - Match corridors from GPS + heading (debug).
 * Validation is done in middleware; params are in req.validated.
 */
export async function getMatchCorridorFromGps(req, res, next) {
  try {
    const { lat, lon, heading, limit } = req.validated;
    const data = await matchCorridorFromGpsService.getMatchCorridorsFromGps(lat, lon, heading, limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
