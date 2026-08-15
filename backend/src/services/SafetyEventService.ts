import { SafetyEvent } from '../models/SafetyEvent';
import { Activity } from '../models/Activity';
import { getIo } from '../sockets/socketHandler';
import { LocalSafetyModel } from './ai/LocalSafetyModel';
import { SafetyModelProvider, ISafetyClassification } from './ai/SafetyModelProvider';
import mongoose from 'mongoose';

// Singleton for now, could be injected
const aiProvider: SafetyModelProvider = new LocalSafetyModel();

export class SafetyEventService {
  
  static async processTextEvent(
    parentId: mongoose.Types.ObjectId | string,
    childId: mongoose.Types.ObjectId | string,
    deviceId: mongoose.Types.ObjectId | string,
    source: 'Notification' | 'SMS' | 'Activity' | 'System',
    text: string,
    title: string,
    evidenceType: string,
    evidenceData: any
  ) {
    const classification = await aiProvider.analyzeText(text);
    const event = await this.handleClassification(parentId, childId, deviceId, source, classification, title, text, evidenceType, evidenceData);
    return { event, classification };
  }

  static async processImageEvent(
    parentId: mongoose.Types.ObjectId | string,
    childId: mongoose.Types.ObjectId | string,
    deviceId: mongoose.Types.ObjectId | string,
    imageMetadata: any,
    title: string
  ) {
    const classification = await aiProvider.analyzeImage(imageMetadata);
    return this.handleClassification(parentId, childId, deviceId, 'Image', classification, title, 'Image processed', 'ImageMetadata', imageMetadata);
  }

  static async processChatMessage(
    parentId: mongoose.Types.ObjectId | string,
    childId: mongoose.Types.ObjectId | string,
    text: string,
    messageId: mongoose.Types.ObjectId | string
  ) {
    const classification = await aiProvider.analyzeText(text);
    const event = await this.handleClassification(parentId, childId, null, 'FAMILY_CHAT_MESSAGE', classification, 'Chat Message Flagged', text, 'TEXT', { messageId });
    return { event, classification };
  }

  static async processChatMedia(
    parentId: mongoose.Types.ObjectId | string,
    childId: mongoose.Types.ObjectId | string,
    mediaAssetId: mongoose.Types.ObjectId | string,
    type: 'IMAGE' | 'VIDEO'
  ) {
    const classification = type === 'IMAGE' ? await aiProvider.analyzeImage({ id: mediaAssetId }) : { category: 'Safe', confidence: 100, severity: 'LOW' as any }; // Mock video analysis logic for prototype
    const event = await this.handleClassification(parentId, childId, null, 'FAMILY_CHAT_MEDIA', classification, 'Chat Media Flagged', 'Media flagged in Family Chat', type, { mediaAssetId });
    return { event, classification };
  }

  private static async handleClassification(
    parentId: any,
    childId: any,
    deviceId: any,
    source: 'Notification' | 'SMS' | 'Image' | 'Activity' | 'System' | 'FAMILY_CHAT_MEDIA' | 'FAMILY_CHAT_MESSAGE',
    classification: ISafetyClassification,
    title: string,
    description: string,
    evidenceType: string,
    evidenceData: any
  ) {
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
    const event = new SafetyEvent({
      parentId,
      childId,
      deviceId,
      source,
      category: classification.category,
      severity: classification.severity,
      confidence: classification.confidence,
      title,
      description: description.substring(0, 200), // Preview only
      evidenceType,
      evidenceData,
      status: 'NEW',
      isRead: false
    });

    await event.save();

    // 4. Log Activity
    const activity = new Activity({
      childId,
      deviceId,
      type: 'SAFETY',
      title: `Safety signal detected`,
      description: `Source: ${source} | Severity: ${classification.severity}`,
      metadata: { category: classification.category, eventId: event._id }
    });
    await activity.save();

    // 5. Emit Real-time alerts
    getIo().to(`parent_${parentId}`).emit('safety:new', event);
    getIo().to(`parent_${parentId}`).emit('activity:new', activity);

    return event;
  }
}
