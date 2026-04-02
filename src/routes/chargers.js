import { Router } from 'express';
import * as chargersNextController from '../controllers/chargersNextController.js';
import { validateChargersNext } from '../middleware/validateChargersNext.js';

const router = Router();
router.get('/next', validateChargersNext, chargersNextController.getNextChargers);

export default router;
