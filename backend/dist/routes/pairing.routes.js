"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pairing_controller_1 = require("../controllers/pairing.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const idempotency_middleware_1 = require("../middleware/idempotency.middleware");
const router = express_1.default.Router();
router.post('/create', auth_middleware_1.protect, idempotency_middleware_1.idempotencyMiddleware, pairing_controller_1.createPairingCode);
router.post('/connect', idempotency_middleware_1.idempotencyMiddleware, pairing_controller_1.connectDevice); // Hit by device, no parent JWT
exports.default = router;
