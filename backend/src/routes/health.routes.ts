import { Router } from 'express';
import { getSystemHealth } from '../controllers/health.controller';
import { protect, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Allow public access to basic health (load balancers usually need this)
// But to prevent exposing sensitive infrastructure details, we could restrict it.
// The requirements say: "Do not expose infrastructure-sensitive information to ordinary users."
// Since it's a parental control app, we can protect the detailed health endpoint.
// We will just protect it entirely.
router.get('/', protect, getSystemHealth);

export default router;
