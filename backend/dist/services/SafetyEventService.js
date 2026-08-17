"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyEventService = void 0;
const SafetyEvent_1 = require("../models/SafetyEvent");
const Activity_1 = require("../models/Activity");
const socketHandler_1 = require("../sockets/socketHandler");
const LocalSafetyModel_1 = require("./ai/LocalSafetyModel");
// Singleton for now, could be injected
const aiProvider = new LocalSafetyModel_1.LocalSafetyModel();
class SafetyEventService {
    static async processTextEvent(parentId, childId, deviceId, source, text, title, evidenceType, evidenceData) {
        const classification = await aiProvider.analyzeText(text);
        const event = await this.handleClassification(parentId, childId, deviceId, source, classification, title, text, evidenceType, evidenceData);
        return { event, classification };
    }
    static async processImageEvent(parentId, childId, deviceId, imageMetadata, title) {
        const classification = await aiProvider.analyzeImage(imageMetadata);
        return this.handleClassification(parentId, childId, deviceId, 'Image', classification, title, 'Image processed', 'ImageMetadata', imageMetadata);
    }
    static async processChatMessage(parentId, childId, text, messageId) {
        const classification = await aiProvider.analyzeText(text);
        const event = await this.handleClassification(parentId, childId, null, 'FAMILY_CHAT_MESSAGE', classification, 'Chat Message Flagged', text, 'TEXT', { messageId });
        return { event, classification };
    }
    static async processChatMedia(parentId, childId, mediaAssetId, type) {
        const classification = type === 'IMAGE' ? await aiProvider.analyzeImage({ id: mediaAssetId }) : { category: 'Safe', confidence: 100, severity: 'LOW', source: 'System' }; // Mock video analysis logic for prototype
        const event = await this.handleClassification(parentId, childId, null, 'FAMILY_CHAT_MEDIA', classification, 'Chat Media Flagged', 'Media flagged in Family Chat', type, { mediaAssetId });
        return { event, classification };
    }
    static async handleClassification(parentId, childId, deviceId, source, classification, title, description, evidenceType, evidenceData) {
        // 1. Adjust classification for low confidence
        if (classification.confidence < 50 && classification.category !== 'Normal' && classification.category !== 'Safe') {
            classification.category = 'Unknown';
            classification.severity = 'LOW';
        }
        // 2. If Normal/Safe, we might not create a SafetyEvent unless requested.
        // Usually, we only create SafetyEvents for issues.
        if (['Normal', 'Safe'].includes(classification.category)) {
            return null;
        }
        // 3. Create SafetyEvent
        const event = new SafetyEvent_1.SafetyEvent({
            parentId,
            childId,
            deviceId,
            source,
            category: classification.category,
            severity: classification.severity,
            confidence: classification.confidence,
            confidenceLevel: classification.confidence >= 80 ? 'HIGH' : classification.confidence >= 50 ? 'MEDIUM' : 'LOW',
            confidenceReason: `AI model reported a confidence score of ${classification.confidence}%.`,
            title,
            description: description.substring(0, 200), // Preview only
            evidenceType,
            evidenceData,
            status: 'NEW',
            isRead: false
        });
        await event.save();
        // 4. Log Activity
        const activity = new Activity_1.Activity({
            childId,
            deviceId,
            type: 'SAFETY',
            title: `Safety signal detected`,
            description: `Source: ${source} | Severity: ${classification.severity}`,
            metadata: { category: classification.category, eventId: event._id }
        });
        await activity.save();
        // 5. Emit Real-time alerts
        (0, socketHandler_1.getIo)().to(`parent_${parentId}`).emit('safety:new', event);
        (0, socketHandler_1.getIo)().to(`parent_${parentId}`).emit('activity:new', activity);
        return event;
    }
}
exports.SafetyEventService = SafetyEventService;
