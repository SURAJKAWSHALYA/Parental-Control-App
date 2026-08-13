"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appLimit_controller_1 = require("../controllers/appLimit.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect); // All routes require parent auth
router.get('/:deviceId', appLimit_controller_1.getAppLimits);
router.post('/', appLimit_controller_1.setAppLimit);
router.put('/:id', appLimit_controller_1.updateAppLimit);
router.delete('/:id', appLimit_controller_1.deleteAppLimit);
exports.default = router;
