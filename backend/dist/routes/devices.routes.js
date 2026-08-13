"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const devices_controller_1 = require("../controllers/devices.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.route('/')
    .get(auth_middleware_1.protect, devices_controller_1.getDevices);
router.route('/:id')
    .get(auth_middleware_1.protect, devices_controller_1.getDevice)
    .delete(auth_middleware_1.protect, devices_controller_1.deleteDevice);
router.get('/:id/status', auth_middleware_1.protect, devices_controller_1.getDeviceStatus);
router.post('/heartbeat', auth_middleware_1.protectDevice, devices_controller_1.heartbeat); // ID inferred from token
exports.default = router;
