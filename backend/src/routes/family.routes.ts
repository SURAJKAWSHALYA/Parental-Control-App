import express from 'express';
import { protect, requirePermission } from '../middleware/auth.middleware';
import { inviteCoParent, getFamilyMembers, updatePermissions, deleteFamilyData } from '../controllers/family.controller';

const router = express.Router();

router.use(protect);

router.get('/members', getFamilyMembers);
router.post('/invite', requirePermission('FULL_CONTROL'), inviteCoParent);
router.put('/permissions/:id', requirePermission('FULL_CONTROL'), updatePermissions);
router.delete('/delete-data', requirePermission('FULL_CONTROL'), deleteFamilyData);

export default router;
