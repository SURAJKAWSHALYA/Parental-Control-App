"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appUsage_controller_1 = require("../controllers/appUsage.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Device endpoint to sync usage data
router.post('/sync', auth_middleware_1.protectDevice, appUsage_controller_1.syncUsage);
// Parent dashboard endpoints
router.get('/:deviceId/today', auth_middleware_1.protect, appUsage_controller_1.getTodayUsage);
router.get('/:deviceId/history', auth_middleware_1.protect, appUsage_controller_1.getUsageHistory);
router.get('/:deviceId', auth_middleware_1.protect, appUsage_controller_1.getTodayUsage); // Fallback for general GET
exports.default = router;
