import { Router } from 'express';
import { getRecommendations, dismissRecommendation } from '../controllers/recommendations.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect as any);

router.get('/', getRecommendations as any);
router.put('/:id/dismiss', dismissRecommendation as any);

export default router;
