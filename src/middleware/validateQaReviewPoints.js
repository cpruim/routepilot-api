import { validateQaReviewPointsParams } from '../utils/validation.js';

/**
 * Validates GET /api/qa-review-points query params.
 * On success sets req.validated = { motorway, direction, category }.
 */
export function validateQaReviewPoints(req, res, next) {
  const result = validateQaReviewPointsParams(req.query);
  if (!result.valid) {
    return res.status(result.statusCode).json({ success: false, error: result.message });
  }
  req.validated = {
    motorway: result.motorway,
    direction: result.direction,
    category: result.category,
  };
  next();
}
