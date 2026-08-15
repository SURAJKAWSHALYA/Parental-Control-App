"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMediaGallery = exports.deleteMedia = exports.getMediaStream = exports.uploadMedia = void 0;
const MediaAsset_1 = require("../models/MediaAsset");
const Conversation_1 = require("../models/Conversation");
const storage_service_1 = require("../services/storage.service");
const path_1 = __importDefault(require("path"));
const uploadMedia = async (req, res) => {
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
        const conversation = await Conversation_1.Conversation.findById(conversationId);
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
        const isVideo = file.mimetype.startsWith('video/');
        const type = isVideo ? 'VIDEO' : 'IMAGE';
        const extension = path_1.default.extname(file.originalname);
        // Abstracted Storage Upload
        const storageKey = await storage_service_1.StorageService.uploadFile(file.buffer, extension);
        // Create Media Asset
        const mediaAsset = await MediaAsset_1.MediaAsset.create({
            familyId: conversation.familyId,
            conversationId: conversation._id,
            uploaderId: req.user.userId,
            deviceId: req.user.deviceId || conversation.childId, // Mocking device ID context
            type,
            storageKey,
            mimeType: file.mimetype,
            size: file.size,
            safetyStatus: 'UNKNOWN'
        });
        // Enqueue media for safety analysis
        const { safetyWorker } = require('../workers/SafetyWorker');
        safetyWorker.enqueueMediaAnalysis(mediaAsset._id, conversation.parentId, conversation.childId, type);
        res.json({ success: true, data: mediaAsset });
    }
    catch (error) {
        console.error('Media upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.uploadMedia = uploadMedia;
const getMediaStream = async (req, res) => {
    try {
        const { id } = req.params;
        const mediaAsset = await MediaAsset_1.MediaAsset.findById(id);
        if (!mediaAsset) {
            res.status(404).json({ success: false, message: 'Media not found' });
            return;
        }
        // Optional: Verify family ownership here before streaming (using req.user info)
        res.setHeader('Content-Type', mediaAsset.mimeType);
        const readStream = storage_service_1.StorageService.getFileStream(mediaAsset.storageKey);
        readStream.pipe(res);
    }
    catch (error) {
        console.error('Media stream error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMediaStream = getMediaStream;
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const mediaAsset = await MediaAsset_1.MediaAsset.findById(id);
        if (!mediaAsset) {
            res.status(404).json({ success: false, message: 'Media not found' });
            return;
        }
        // Authorize deletion
        if (mediaAsset.uploaderId.toString() !== req.user.userId.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized to delete' });
            return;
        }
        const storageDeleted = await storage_service_1.StorageService.deleteFile(mediaAsset.storageKey);
        if (storageDeleted) {
            await MediaAsset_1.MediaAsset.findByIdAndDelete(id);
            res.json({ success: true, message: 'Media deleted securely' });
        }
        else {
            res.status(500).json({ success: false, message: 'Failed to delete file from storage' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteMedia = deleteMedia;
const getMediaGallery = async (req, res) => {
    try {
        const { cursor, limit = 50, safetyStatus, type, childId } = req.query;
        let query = {};
        if (req.user.role === 'parent') {
            query = { familyId: req.user.familyId };
            if (childId) {
                // Find conversation for this child
                const conversation = await Conversation_1.Conversation.findOne({ parentId: req.user.id, childId });
                if (conversation) {
                    query.conversationId = conversation._id;
                }
                else {
                    return res.json({ success: true, data: [] });
                }
            }
        }
        else {
            query = { uploaderId: req.user.userId };
        }
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }
        if (safetyStatus)
            query.safetyStatus = safetyStatus;
        if (type)
            query.type = type;
        const assets = await MediaAsset_1.MediaAsset.find(query).sort({ createdAt: -1 }).limit(Number(limit));
        res.json({ success: true, data: assets });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMediaGallery = getMediaGallery;
