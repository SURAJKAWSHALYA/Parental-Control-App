import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requestReport, getReportStatus, getReportList, downloadReport } from '../controllers/reports.controller';

const router = express.Router();

router.use(protect);

router.post('/request', requestReport);
router.get('/', getReportList);
router.get('/:id/status', getReportStatus);
router.get('/:id/download', downloadReport);

export default router;
