"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permission_controller_1 = require("../controllers/permission.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Used by child device
router.post('/sync/:deviceId', auth_middleware_1.protect, permission_controller_1.syncPermissions);
// Used by parent dashboard
router.get('/:deviceId', auth_middleware_1.protect, permission_controller_1.getPermissions);
exports.default = router;
