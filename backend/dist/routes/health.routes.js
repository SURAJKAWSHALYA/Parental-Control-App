"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Allow public access to basic health (load balancers usually need this)
// But to prevent exposing sensitive infrastructure details, we could restrict it.
// The requirements say: "Do not expose infrastructure-sensitive information to ordinary users."
// Since it's a parental control app, we can protect the detailed health endpoint.
// We will just protect it entirely.
router.get('/', auth_middleware_1.protect, health_controller_1.getSystemHealth);
exports.default = router;
