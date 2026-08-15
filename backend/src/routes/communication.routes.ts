import { Router } from 'express';
import { 
  syncCall, 
  syncSms, 
  getCalls, 
  getSms 
} from '../controllers/communication.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Used by child device
router.post('/calls/sync/:deviceId', protect, syncCall);
router.post('/sms/sync/:deviceId', protect, syncSms);

// Used by parent dashboard
router.get('/calls', protect, getCalls);
router.get('/sms', protect, getSms);

export default router;
