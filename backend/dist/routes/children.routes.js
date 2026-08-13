"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const children_controller_1 = require("../controllers/children.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.route('/')
    .get(auth_middleware_1.protect, children_controller_1.getChildren)
    .post(auth_middleware_1.protect, children_controller_1.addChild);
router.route('/:id')
    .get(auth_middleware_1.protect, children_controller_1.getChild)
    .put(auth_middleware_1.protect, children_controller_1.updateChild)
    .delete(auth_middleware_1.protect, children_controller_1.deleteChild);
exports.default = router;
