"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Used by child device
router.post('/sync/:deviceId', auth_middleware_1.protect, notification_controller_1.processNotification);
// Used by parent dashboard
router.get('/', auth_middleware_1.protect, notification_controller_1.getNotifications);
router.get('/counts', auth_middleware_1.protect, notification_controller_1.getNotificationCounts);
router.put('/settings/:deviceId', auth_middleware_1.protect, notification_controller_1.updateSettings);
exports.default = router;
