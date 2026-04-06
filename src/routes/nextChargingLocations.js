import { Router } from 'express';
import * as nextChargingLocationsController from '../controllers/nextChargingLocationsController.js';
import { validateNextChargingLocations } from '../middleware/validateNextChargingLocations.js';

const router = Router();

/**
 * GET /api/next-charging-locations?corridorKey=NL_A27_FWD&currentM=25000&limit=5
 * (limit default 5; backend: rp_api_next_charging_locations_v1 named + p_bucket_size_m)
 */
router.get('/', validateNextChargingLocations, nextChargingLocationsController.getNextChargingLocations);

export default router;
