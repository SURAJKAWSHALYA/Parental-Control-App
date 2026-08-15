import { Router } from 'express';
import { syncPermissions, getPermissions } from '../controllers/permission.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Used by child device
router.post('/sync/:deviceId', protect, syncPermissions);

// Used by parent dashboard
router.get('/:deviceId', protect, getPermissions);

export default router;
