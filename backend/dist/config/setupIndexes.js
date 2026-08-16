"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIndexes = void 0;
const logger_1 = require("../utils/logger");
const Parent_1 = require("../models/Parent");
const Device_1 = require("../models/Device");
const Activity_1 = require("../models/Activity");
const LocationRecord_1 = require("../models/LocationRecord");
const Message_1 = require("../models/Message");
const MediaAsset_1 = require("../models/MediaAsset");
const Alert_1 = require("../models/Alert");
const SafetyEvent_1 = require("../models/SafetyEvent");
const AuditLog_1 = require("../models/AuditLog");
const setupIndexes = async () => {
    try {
        logger_1.logger.info('Starting database index setup...');
        // 1. users.email (Parents)
        await Parent_1.Parent.collection.createIndex({ email: 1 }, { unique: true });
        // 2. devices.parentId and devices.childId
        await Device_1.Device.collection.createIndex({ parentId: 1 });
        await Device_1.Device.collection.createIndex({ childId: 1 });
        // 3. activities.deviceId + timestamp
        await Activity_1.Activity.collection.createIndex({ deviceId: 1, timestamp: -1 });
        // 4. locations.deviceId + timestamp
        await LocationRecord_1.LocationRecord.collection.createIndex({ deviceId: 1, timestamp: -1 });
        // 5. messages.conversationId + createdAt
        await Message_1.Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
        // 6. media.familyId + createdAt
        await MediaAsset_1.MediaAsset.collection.createIndex({ familyId: 1, createdAt: -1 });
        // 7. alerts.parentId + createdAt
        await Alert_1.Alert.collection.createIndex({ parentId: 1, createdAt: -1 });
        // 8. safetyEvents.childId + timestamp
        await SafetyEvent_1.SafetyEvent.collection.createIndex({ childId: 1, timestamp: -1 });
        // 9. auditLogs.familyId + timestamp
        await AuditLog_1.AuditLog.collection.createIndex({ familyId: 1, timestamp: -1 });
        logger_1.logger.info('Database index setup completed successfully.');
    }
    catch (error) {
        logger_1.logger.error('Error setting up database indexes:', { error: error.message, stack: error.stack });
        throw error;
    }
};
exports.setupIndexes = setupIndexes;
