import { Router } from 'express';
import { getSafetyScore, getSafetyTrends } from '../controllers/intelligence.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect as any);

router.get('/:childId/score', getSafetyScore as any);
router.get('/:childId/trends', getSafetyTrends as any);

export default router;
