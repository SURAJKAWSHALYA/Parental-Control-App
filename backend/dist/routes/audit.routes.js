"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const audit_controller_1 = require("../controllers/audit.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/', (0, auth_middleware_1.requirePermission)('FULL_CONTROL'), audit_controller_1.getAuditLogs);
exports.default = router;
