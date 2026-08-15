"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect); // Ensure user is authenticated
router.route('/conversations')
    .get(chat_controller_1.getConversations)
    .post(chat_controller_1.createConversation);
router.route('/:conversationId/messages')
    .get(chat_controller_1.getMessages)
    .post(chat_controller_1.sendMessage);
router.route('/messages/:id/read')
    .put(chat_controller_1.markAsRead);
router.route('/messages/:id')
    .delete(chat_controller_1.deleteMessage);
exports.default = router;
