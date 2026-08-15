import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Child } from '../models/Child';
import { getIo } from '../sockets/socketHandler';
import { Activity } from '../models/Activity';

// Helper to check ownership
const verifyFamilyOwnership = async (user: any, conversationId: string) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  if (user.role === 'parent' && conversation.parentId.toString() !== user.id) return null;
  if (user.role === 'child' && conversation.childId.toString() !== user.id) return null;

  return conversation;
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const role = req.user.role; // 'parent' or 'child'

    const query = role === 'parent' ? { parentId: userId } : { childId: userId };
    
    const conversations = await Conversation.find(query)
      .populate('childId', 'name')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { childId } = req.body;
    const parentId = req.user.id;

    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Only parents can create conversations initially' });
    }

    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) return res.status(404).json({ success: false, message: 'Child not found in family' });

    let conversation = await Conversation.findOne({ parentId, childId, type: 'DIRECT' });
    if (!conversation) {
      conversation = await Conversation.create({ parentId, childId, type: 'DIRECT' });
    }

    res.json({ success: true, data: conversation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { cursor, direction = 'older', limit = 50, search, senderType, messageType, safetyStatus } = req.query;

    const conversation = await verifyFamilyOwnership(req.user, conversationId);
    if (!conversation) return res.status(403).json({ success: false, message: 'Unauthorized access to conversation' });

    let query: any = { conversationId };

    if (cursor) {
      if (direction === 'newer') {
        query.createdAt = { $gt: new Date(cursor as string) };
      } else {
        query.createdAt = { $lt: new Date(cursor as string) };
      }
    }

    if (search) {
       query.text = { $regex: search, $options: 'i' };
    }

    if (senderType) query.senderType = senderType;
    if (messageType) query.messageType = messageType;
    if (safetyStatus) query.safetyStatus = safetyStatus;

    const sortOrder = direction === 'newer' ? 1 : -1;

    let messages = await Message.find(query)
      .sort({ createdAt: sortOrder })
      .limit(Number(limit));

    // If fetched newer, they come back in ascending order. 
    // We typically want them delivered in descending order for the frontend to consistently prepend/append.
    if (direction === 'newer') {
      messages = messages.reverse();
    }

    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { text, clientMessageId } = req.body;

    if (!text || text.length > 5000) {
      return res.status(400).json({ success: false, message: 'Message length invalid' });
    }

    const conversation = await verifyFamilyOwnership(req.user, conversationId);
    if (!conversation) return res.status(403).json({ success: false, message: 'Unauthorized' });

    // Dedup check
    if (clientMessageId) {
      const existing = await Message.findOne({ clientMessageId, conversationId });
      if (existing) return res.json({ success: true, data: existing, duplicated: true });
    }

    const senderType = req.user.role === 'parent' ? 'Parent' : 'Child';
    
    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderType,
      text,
      clientMessageId,
      status: 'SENT'
    });

    // Enqueue text for safety analysis
    const { safetyWorker } = require('../workers/SafetyWorker');
    safetyWorker.enqueueMessageAnalysis(
      message._id, 
      conversation.parentId, 
      conversation.childId, 
      text
    );

    conversation.lastMessage = message.id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    // Broadcast via Socket
    const io = getIo();
    const targetRoom = senderType === 'Parent' ? `device_${conversation.childId}` : `parent_${conversation.parentId}`;
    io.to(targetRoom).emit('chat:message', message);

    // Activity Log
    await Activity.create({
      childId: conversation.childId,
      deviceId: req.user.deviceId || null, // Assuming child auth sets deviceId if it comes from device
      type: senderType === 'Parent' ? 'CHAT_MESSAGE_RECEIVED' : 'CHAT_MESSAGE_SENT',
      title: senderType === 'Parent' ? 'New Message from Parent' : 'New Message from Child',
      description: 'A family chat message was processed.',
    });

    // Create Notification Record for Parent -> Child or Child -> Parent
    const notificationText = text.length > 50 ? text.substring(0, 47) + '...' : text;
    
    // We only need to import NotificationRecord. Let's do it inline to avoid importing at the top
    const { NotificationRecord } = require('../models/NotificationRecord');
    
    // For Parent Dashboard or Child Device
    const notification = await NotificationRecord.create({
      childId: conversation.childId,
      deviceId: req.user.deviceId || conversation.childId, // Mocking deviceId if it's parent sending
      packageName: 'com.parentalcontrol.chat',
      appName: 'Family Chat',
      notificationTitle: senderType === 'Parent' ? 'New message from Parent' : 'New message from Child',
      notificationText: notificationText,
      category: 'CHAT_MESSAGE',
      isSensitive: false,
    });
    
    // Emit notification event to socket for immediate update
    io.to(targetRoom).emit('notification:new', notification);

    res.json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    
    const conversation = await verifyFamilyOwnership(req.user, message.conversationId.toString());
    if (!conversation) return res.status(403).json({ success: false, message: 'Unauthorized' });

    message.status = 'READ';
    await message.save();

    const io = getIo();
    const targetRoom = req.user.role === 'parent' ? `device_${conversation.childId}` : `parent_${conversation.parentId}`;
    io.to(targetRoom).emit('chat:message:read', { messageId: message._id, conversationId: conversation._id });

    res.json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    
    const conversation = await verifyFamilyOwnership(req.user, message.conversationId.toString());
    if (!conversation) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (message.senderId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Cannot delete other user message' });
    }

    await Message.findByIdAndDelete(id);

    const io = getIo();
    const targetRoom = req.user.role === 'parent' ? `device_${conversation.childId}` : `parent_${conversation.parentId}`;
    io.to(targetRoom).emit('chat:message:deleted', { messageId: id, conversationId: conversation._id });

    // Activity Log
    await Activity.create({
      childId: conversation.childId,
      deviceId: req.user.deviceId || null,
      type: 'CHAT_MESSAGE_DELETED',
      title: 'Message Deleted',
      description: 'A family chat message was deleted.',
    });

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
