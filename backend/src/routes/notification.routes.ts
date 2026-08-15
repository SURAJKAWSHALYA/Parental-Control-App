import { Router } from 'express';
import { 
  processNotification, 
  getNotifications, 
  getNotificationCounts, 
  updateSettings 
} from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Used by child device
router.post('/sync/:deviceId', protect, processNotification);

// Used by parent dashboard
router.get('/', protect, getNotifications);
router.get('/counts', protect, getNotificationCounts);
router.put('/settings/:deviceId', protect, updateSettings);

export default router;
