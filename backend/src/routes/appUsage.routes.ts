import express from 'express';
import { syncUsage, getTodayUsage, getUsageHistory } from '../controllers/appUsage.controller';
import { protect, protectDevice } from '../middleware/auth.middleware';

const router = express.Router();

// Device endpoint to sync usage data
router.post('/sync', protectDevice, syncUsage);

// Parent dashboard endpoints
router.get('/:deviceId/today', protect, getTodayUsage);
router.get('/:deviceId/history', protect, getUsageHistory);
router.get('/:deviceId', protect, getTodayUsage); // Fallback for general GET

export default router;
