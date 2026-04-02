import { Router } from 'express';
import * as matchCorridorFromGpsController from '../controllers/matchCorridorFromGpsController.js';
import { validateMatchCorridorFromGps } from '../middleware/validateMatchCorridorFromGps.js';

const router = Router();
router.get('/', validateMatchCorridorFromGps, matchCorridorFromGpsController.getMatchCorridorFromGps);

export default router;
