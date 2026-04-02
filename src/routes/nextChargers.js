import { Router } from 'express';
import * as nextChargersController from '../controllers/nextChargersController.js';
import { validateNextChargers } from '../middleware/validateNextChargers.js';

const router = Router();
router.get('/', validateNextChargers, nextChargersController.getNextChargers);

export default router;
