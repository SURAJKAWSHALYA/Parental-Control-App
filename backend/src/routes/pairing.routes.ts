import express from 'express';
import { createPairingCode, connectDevice } from '../controllers/pairing.controller';
import { protect } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = express.Router();

router.post('/create', protect, idempotencyMiddleware, createPairingCode);
router.post('/connect', idempotencyMiddleware, connectDevice); // Hit by device, no parent JWT

export default router;
