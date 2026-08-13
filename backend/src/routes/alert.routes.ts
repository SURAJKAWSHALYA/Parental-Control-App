import express from 'express';
import { getAlerts, getAlert, markAsRead, markAllAsRead } from '../controllers/alert.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/', getAlerts);
router.put('/read-all', markAllAsRead);
router.get('/:id', getAlert);
router.put('/:id/read', markAsRead);

export default router;
