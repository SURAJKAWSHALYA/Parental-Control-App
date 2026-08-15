import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { getDeviceHealth } from '../controllers/deviceHealth.controller';

const router = express.Router();

router.use(protect);

router.get('/:deviceId', getDeviceHealth);

export default router;
