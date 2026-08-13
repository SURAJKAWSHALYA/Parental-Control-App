"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const downtime_controller_1 = require("../controllers/downtime.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/:deviceId', downtime_controller_1.getDowntimeSchedules);
router.post('/', downtime_controller_1.createDowntimeSchedule);
router.put('/:id', downtime_controller_1.updateDowntimeSchedule);
router.delete('/:id', downtime_controller_1.deleteDowntimeSchedule);
exports.default = router;
