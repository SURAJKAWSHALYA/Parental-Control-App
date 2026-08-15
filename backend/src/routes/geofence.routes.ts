import { Router } from 'express';
import {
  getGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
  handleGeofenceEvent
} from '../controllers/geofence.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/event', protect, handleGeofenceEvent);

router.use(protect);

router.get('/:deviceId', getGeofences);
router.post('/:deviceId', createGeofence);
router.put('/:deviceId/:id', updateGeofence);
router.delete('/:deviceId/:id', deleteGeofence);

export default router;
