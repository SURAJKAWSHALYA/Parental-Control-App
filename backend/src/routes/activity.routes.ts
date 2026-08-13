import express from 'express';
import { getActivity } from '../controllers/activity.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/:deviceId', getActivity);

export default router;
