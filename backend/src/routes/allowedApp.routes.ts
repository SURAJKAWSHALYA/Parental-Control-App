import express from 'express';
import { getAllowedApps, createAllowedApp, updateAllowedApp, deleteAllowedApp } from '../controllers/allowedApp.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/:deviceId', getAllowedApps);
router.post('/', createAllowedApp);
router.put('/:id', updateAllowedApp);
router.delete('/:id', deleteAllowedApp);

export default router;
