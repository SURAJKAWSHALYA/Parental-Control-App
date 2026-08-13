"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
router.post('/register', rateLimiter_1.authLimiter, auth_controller_1.register);
router.post('/login', rateLimiter_1.authLimiter, auth_controller_1.login);
router.get('/me', auth_middleware_1.protect, auth_controller_1.getMe);
router.post('/logout', auth_middleware_1.protect, auth_controller_1.logout);
exports.default = router;
