import { Router } from 'express';
import {
  syncLocation,
  getCurrentLocation,
  getLocationHistory,
  deleteLocationHistory
} from '../controllers/location.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Device sync route could be open to device token or parent token
router.post('/sync', protect, syncLocation);

router.use(protect);

router.get('/:deviceId/current', getCurrentLocation);
router.get('/:deviceId/history', getLocationHistory);
router.delete('/:deviceId/history', deleteLocationHistory);

export default router;
