"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const idempotency_middleware_1 = require("../middleware/idempotency.middleware");
const router = (0, express_1.Router)();
// Device sync route could be open to device token or parent token
router.post('/sync', auth_middleware_1.protect, idempotency_middleware_1.idempotencyMiddleware, location_controller_1.syncLocation);
router.use(auth_middleware_1.protect);
router.get('/:deviceId/current', location_controller_1.getCurrentLocation);
router.get('/:deviceId/history', location_controller_1.getLocationHistory);
router.delete('/:deviceId/history', location_controller_1.deleteLocationHistory);
exports.default = router;
