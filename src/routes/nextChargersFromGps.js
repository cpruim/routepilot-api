import { Router } from 'express';
import * as nextChargersFromGpsController from '../controllers/nextChargersFromGpsController.js';
import { validateNextChargersFromGps } from '../middleware/validateNextChargersFromGps.js';

const router = Router();
router.get('/', validateNextChargersFromGps, nextChargersFromGpsController.getNextChargersFromGps);

export default router;
