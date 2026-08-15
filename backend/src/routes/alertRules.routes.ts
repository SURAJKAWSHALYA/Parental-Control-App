import { Router } from 'express';
import { getAlertRules, updateAlertRule } from '../controllers/alertRules.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect as any);

router.get('/child/:childId', getAlertRules as any);
router.put('/:id', updateAlertRule as any);

export default router;
