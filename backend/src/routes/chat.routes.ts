import { Router } from 'express';
import { getConversations, createConversation, getMessages, sendMessage, markAsRead, deleteMessage } from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect); // Ensure user is authenticated

router.route('/conversations')
  .get(getConversations)
  .post(createConversation);

router.route('/:conversationId/messages')
  .get(getMessages)
  .post(sendMessage);

router.route('/messages/:id/read')
  .put(markAsRead);

router.route('/messages/:id')
  .delete(deleteMessage);

export default router;
