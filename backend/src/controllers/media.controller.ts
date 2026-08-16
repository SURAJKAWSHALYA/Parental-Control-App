import { Request, Response } from 'express';
import { MediaAsset } from '../models/MediaAsset';
import { Conversation } from '../models/Conversation';
import { StorageService } from '../services/storage.service';
import path from 'path';

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId, senderType } = req.body; // senderType: 'Parent' | 'Child'
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    if (!conversationId || !senderType) {
      res.status(400).json({ success: false, message: 'conversationId and senderType are required' });
      return;
    }

    // Verify conversation existence and ownership
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    // Basic ownership check
    if (senderType === 'Parent' && conversation.parentId.toString() !== req.user.userId.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    if (senderType === 'Child' && conversation.childId.toString() !== req.user.userId.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ success: false, message: 'Invalid file type' });
      return;
    }

    const isVideo = file.mimetype.startsWith('video/');
    const type = isVideo ? 'VIDEO' : 'IMAGE';
    const extension = path.extname(file.originalname);
    
    // Abstracted Storage Upload
    const storageKey = await StorageService.uploadFile(file.buffer, extension);
    
    // Create Media Asset
    const mediaAsset = await MediaAsset.create({
      familyId: conversation.parentId,
      conversationId: conversation._id,
      uploaderId: req.user.id || req.user.deviceId,
      deviceId: req.user.deviceId || conversation.childId, // Mocking device ID context
      type,
      storageKey,
      mimeType: file.mimetype,
      size: file.size,
      safetyStatus: 'UNKNOWN'
    });

    // Enqueue media for safety analysis
    const { safetyWorker } = require('../workers/SafetyWorker');
    safetyWorker.enqueueMediaAnalysis(
      mediaAsset._id, 
      conversation.parentId, 
      conversation.childId, 
      type
    );

    res.json({ success: true, data: mediaAsset });
  } catch (error: any) {
    console.error('Media upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMediaStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mediaAsset = await MediaAsset.findById(id);

    if (!mediaAsset) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }

    // Verify family ownership before streaming
    const userId = (req.user.id || req.user.deviceId)?.toString();
    const familyId = req.user.familyId?.toString();
    
    // Check if the user is the uploader, or part of the same family
    const isOwner = mediaAsset.uploaderId.toString() === userId || 
                    (familyId && mediaAsset.familyId.toString() === familyId);
                    
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Not authorized to view this media' });
      return;
    }

    res.setHeader('Content-Type', mediaAsset.mimeType);
    
    const readStream = StorageService.getFileStream(mediaAsset.storageKey);
    readStream.pipe(res);
  } catch (error: any) {
    console.error('Media stream error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mediaAsset = await MediaAsset.findById(id);

    if (!mediaAsset) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }

    // Authorize deletion
    if (mediaAsset.uploaderId.toString() !== (req.user.id || req.user.deviceId)?.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to delete' });
      return;
    }

    const storageDeleted = await StorageService.deleteFile(mediaAsset.storageKey);
    
    if (storageDeleted) {
      await MediaAsset.findByIdAndDelete(id);
      res.json({ success: true, message: 'Media deleted securely' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete file from storage' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMediaGallery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cursor, limit = 50, safetyStatus, type, childId } = req.query;

    let query: any = {};
    if (req.user.role === 'parent') {
      query = { familyId: req.user.familyId }; 
      if (childId) {
        // Find conversation for this child
        const conversation = await Conversation.findOne({ parentId: req.user.id, childId });
        if (conversation) {
          query.conversationId = conversation._id;
        } else {
          res.json({ success: true, data: [] });
          return;
        }
      }
    } else {
      query = { uploaderId: req.user.id || req.user.deviceId };
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor as string) };
    }
    
    if (safetyStatus) query.safetyStatus = safetyStatus;
    if (type) query.type = type;

    const assets = await MediaAsset.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, data: assets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
