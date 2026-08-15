import express from 'express';
import { protect, requirePermission } from '../middleware/auth.middleware';
import { getAuditLogs } from '../controllers/audit.controller';

const router = express.Router();

router.use(protect);

router.get('/', requirePermission('FULL_CONTROL'), getAuditLogs);

export default router;
