import express from 'express';
import { createPairingCode, connectDevice } from '../controllers/pairing.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/create', protect, createPairingCode);
router.post('/connect', connectDevice); // Hit by device, no parent JWT

export default router;
