import { Router } from 'express';
import healthRoutes from './health.js';
import corridorsRoutes from './corridors.js';
import nextChargersRoutes from './nextChargers.js';
import nextChargingLocationsRoutes from './nextChargingLocations.js';
import nextChargersFromGpsRoutes from './nextChargersFromGps.js';
import matchCorridorFromGpsRoutes from './matchCorridorFromGps.js';
import chargersRoutes from './chargers.js';
import chargingLocationAvailabilityRoutes from './chargingLocationAvailability.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/api/corridors', corridorsRoutes);
router.use('/api/next-chargers', nextChargersRoutes);
router.use('/api/next-charging-locations', nextChargingLocationsRoutes);
router.use('/api/next-chargers-from-gps', nextChargersFromGpsRoutes);
router.use('/api/match-corridor-from-gps', matchCorridorFromGpsRoutes);
router.use('/api/chargers', chargersRoutes);
router.use('/api/charging-location-availability', chargingLocationAvailabilityRoutes);

export default router;
