import { Router } from 'express';
import * as qaReviewPointsController from '../controllers/qaReviewPointsController.js';
import { validateQaReviewPoints } from '../middleware/validateQaReviewPoints.js';

const router = Router();
router.get('/', validateQaReviewPoints, qaReviewPointsController.getQaReviewPoints);

export default router;
