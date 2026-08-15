"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/summary', analytics_controller_1.getFamilySummary);
router.get('/insights', analytics_controller_1.getFamilyInsights);
router.get('/child-overview/:childId', analytics_controller_1.getChildOverview);
router.get('/trends', analytics_controller_1.getTrendData);
exports.default = router;
