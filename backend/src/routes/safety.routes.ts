import { Router } from 'express';
import { 
  getSafetyEvents, 
  getSafetyOverview, 
  updateSafetyEventStatus, 
  submitSafetyFeedback,
  markAllRead
} from '../controllers/safety.controller';
import { protect } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

router.use(protect);

router.get('/', getSafetyEvents);
router.get('/overview', getSafetyOverview);
router.put('/read-all', markAllRead);
router.put('/:id', updateSafetyEventStatus);
router.post('/:id/feedback', idempotencyMiddleware, submitSafetyFeedback);

export default router;
