import * as qaReviewPointsService from '../services/qaReviewPointsService.js';

/**
 * GET /api/qa-review-points — punten uit rp_qa_review_points_v1, gesorteerd op corridor_key, current_m.
 */
export async function getQaReviewPoints(req, res, next) {
  try {
    const { motorway, direction, category } = req.validated;
    const payload = await qaReviewPointsService.getQaReviewPoints(motorway, direction, category);
    res.json(payload);
  } catch (err) {
    const code = err && typeof err === 'object' ? err.code : undefined;
    if (code === '42P01' || code === '42703') {
      return res.status(503).json({
        success: false,
        error: 'QA-review view of kolommen niet beschikbaar; controleer database-migratie.',
      });
    }
    next(err);
  }
}
