import express from 'express';
import { getDowntimeSchedules, createDowntimeSchedule, updateDowntimeSchedule, deleteDowntimeSchedule } from '../controllers/downtime.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/:deviceId', getDowntimeSchedules);
router.post('/', createDowntimeSchedule);
router.put('/:id', updateDowntimeSchedule);
router.delete('/:id', deleteDowntimeSchedule);

export default router;
