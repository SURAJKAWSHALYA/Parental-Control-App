import { Router } from 'express';
import { getWeeklyReport, getSafetyReport, getCommunicationReport, getFamilyCommunicationReport } from '../controllers/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/weekly', getWeeklyReport);
router.get('/:deviceId/safety', getSafetyReport);
router.get('/:deviceId/communications', getCommunicationReport);
router.get('/:childId/family-communication', getFamilyCommunicationReport);

export default router;
