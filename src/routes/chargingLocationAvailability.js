import { Router } from 'express';
import * as chargingLocationAvailabilityController from '../controllers/chargingLocationAvailabilityController.js';
import { validateChargingLocationAvailabilityBody } from '../middleware/validateChargingLocationAvailabilityBody.js';

const router = Router();

/**
 * POST /api/charging-location-availability
 * Body: { "locationIds": ["access:1496", ...] }
 */
router.post(
  '/',
  validateChargingLocationAvailabilityBody,
  chargingLocationAvailabilityController.postChargingLocationAvailability
);

export default router;
