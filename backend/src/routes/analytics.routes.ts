import express from 'express';
import { getFamilySummary, getFamilyInsights, getChildOverview, getTrendData } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/summary', getFamilySummary);
router.get('/insights', getFamilyInsights);
router.get('/child-overview/:childId', getChildOverview);
router.get('/trends', getTrendData);

export default router;
