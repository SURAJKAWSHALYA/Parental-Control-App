import express from 'express';
import { getAppLimits, setAppLimit, updateAppLimit, deleteAppLimit } from '../controllers/appLimit.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect); // All routes require parent auth

router.get('/:deviceId', getAppLimits);
router.post('/', setAppLimit);
router.put('/:id', updateAppLimit);
router.delete('/:id', deleteAppLimit);

export default router;
