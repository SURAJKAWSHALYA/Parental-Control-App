"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const deviceHealth_controller_1 = require("../controllers/deviceHealth.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/:deviceId', deviceHealth_controller_1.getDeviceHealth);
exports.default = router;
