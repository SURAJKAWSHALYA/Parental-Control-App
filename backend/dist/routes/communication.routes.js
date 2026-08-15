"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communication_controller_1 = require("../controllers/communication.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Used by child device
router.post('/calls/sync/:deviceId', auth_middleware_1.protect, communication_controller_1.syncCall);
router.post('/sms/sync/:deviceId', auth_middleware_1.protect, communication_controller_1.syncSms);
// Used by parent dashboard
router.get('/calls', auth_middleware_1.protect, communication_controller_1.getCalls);
router.get('/sms', auth_middleware_1.protect, communication_controller_1.getSms);
exports.default = router;
