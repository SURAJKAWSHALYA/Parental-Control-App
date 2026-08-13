"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const alert_controller_1 = require("../controllers/alert.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/', alert_controller_1.getAlerts);
router.put('/read-all', alert_controller_1.markAllAsRead);
router.get('/:id', alert_controller_1.getAlert);
router.put('/:id/read', alert_controller_1.markAsRead);
exports.default = router;
