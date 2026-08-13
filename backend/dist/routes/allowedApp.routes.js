"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const allowedApp_controller_1 = require("../controllers/allowedApp.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/:deviceId', allowedApp_controller_1.getAllowedApps);
router.post('/', allowedApp_controller_1.createAllowedApp);
router.put('/:id', allowedApp_controller_1.updateAllowedApp);
router.delete('/:id', allowedApp_controller_1.deleteAllowedApp);
exports.default = router;
