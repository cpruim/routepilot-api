import * as corridorsService from '../services/corridorsService.js';
import { parseCorridorsLimit } from '../utils/validation.js';

/**
 * GET /api/corridors - List corridors with optional limit.
 */
export async function getCorridors(req, res, next) {
  try {
    const { limit } = parseCorridorsLimit(req.query);
    const data = await corridorsService.getCorridors(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
