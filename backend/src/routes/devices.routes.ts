import express from 'express';
import { getDevices, getDevice, deleteDevice, heartbeat, getDeviceStatus } from '../controllers/devices.controller';
import { protect, protectDevice } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, getDevices);

router.route('/:id')
  .get(protect, getDevice)
  .delete(protect, deleteDevice);

router.get('/:id/status', protect, getDeviceStatus);
router.post('/heartbeat', protectDevice, heartbeat); // ID inferred from token

export default router;
