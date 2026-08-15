"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const family_controller_1 = require("../controllers/family.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/members', family_controller_1.getFamilyMembers);
router.post('/invite', (0, auth_middleware_1.requirePermission)('FULL_CONTROL'), family_controller_1.inviteCoParent);
router.put('/permissions/:id', (0, auth_middleware_1.requirePermission)('FULL_CONTROL'), family_controller_1.updatePermissions);
router.delete('/delete-data', (0, auth_middleware_1.requirePermission)('FULL_CONTROL'), family_controller_1.deleteFamilyData);
exports.default = router;
