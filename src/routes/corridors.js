import { Router } from 'express';
import * as corridorsController from '../controllers/corridorsController.js';

const router = Router();
router.get('/', corridorsController.getCorridors);

export default router;
