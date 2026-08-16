import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Parent } from '../models/Parent';
import { Device } from '../models/Device';
import { Activity } from '../models/Activity';
import { LocationRecord } from '../models/LocationRecord';
import { Message } from '../models/Message';
import { MediaAsset } from '../models/MediaAsset';
import { Alert } from '../models/Alert';
import { SafetyEvent } from '../models/SafetyEvent';
import { AuditLog } from '../models/AuditLog';

export const setupIndexes = async () => {
  try {
    logger.info('Starting database index setup...');

    // 1. users.email (Parents)
    await Parent.collection.createIndex({ email: 1 }, { unique: true });

    // 2. devices.parentId and devices.childId
    await Device.collection.createIndex({ parentId: 1 });
    await Device.collection.createIndex({ childId: 1 });

    // 3. activities.deviceId + timestamp
    await Activity.collection.createIndex({ deviceId: 1, timestamp: -1 });

    // 4. locations.deviceId + timestamp
    await LocationRecord.collection.createIndex({ deviceId: 1, timestamp: -1 });

    // 5. messages.conversationId + createdAt
    await Message.collection.createIndex({ conversationId: 1, createdAt: -1 });

    // 6. media.familyId + createdAt
    await MediaAsset.collection.createIndex({ familyId: 1, createdAt: -1 });

    // 7. alerts.parentId + createdAt
    await Alert.collection.createIndex({ parentId: 1, createdAt: -1 });

    // 8. safetyEvents.childId + timestamp
    await SafetyEvent.collection.createIndex({ childId: 1, timestamp: -1 });

    // 9. auditLogs.familyId + timestamp
    await AuditLog.collection.createIndex({ familyId: 1, timestamp: -1 });

    logger.info('Database index setup completed successfully.');
  } catch (error: any) {
    logger.error('Error setting up database indexes:', { error: error.message, stack: error.stack });
    throw error;
  }
};
