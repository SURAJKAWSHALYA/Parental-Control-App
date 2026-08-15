"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupWorker = void 0;
const Message_1 = require("../models/Message");
const MediaAsset_1 = require("../models/MediaAsset");
const SafetyEvent_1 = require("../models/SafetyEvent");
const storage_service_1 = require("../services/storage.service");
class CleanupWorker {
    // Configurable retention (e.g. 30 days)
    static async cleanupOldCommunicationData(daysToKeep = 30) {
        console.log(`[CleanupWorker] Starting cleanup of communication data older than ${daysToKeep} days...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        try {
            // 1. Find and delete expired media from Storage
            const expiredMedia = await MediaAsset_1.MediaAsset.find({ createdAt: { $lt: cutoffDate } });
            for (const media of expiredMedia) {
                try {
                    await storage_service_1.StorageService.deleteFile(media.storageKey);
                }
                catch (e) {
                    console.error(`[CleanupWorker] Failed to delete file ${media.storageKey} from storage:`, e);
                }
            }
            // 2. Delete Media records from Database
            const mediaDeleteResult = await MediaAsset_1.MediaAsset.deleteMany({ createdAt: { $lt: cutoffDate } });
            // 3. Delete Message records from Database
            const messagesDeleteResult = await Message_1.Message.deleteMany({ createdAt: { $lt: cutoffDate } });
            // 4. Delete related SafetyEvents from Database
            const safetyEventsDeleteResult = await SafetyEvent_1.SafetyEvent.deleteMany({
                source: { $in: ['FAMILY_CHAT_MESSAGE', 'FAMILY_CHAT_MEDIA'] },
                timestamp: { $lt: cutoffDate }
            });
            console.log(`[CleanupWorker] Cleanup complete.`);
            console.log(`- Media: ${mediaDeleteResult.deletedCount} deleted`);
            console.log(`- Messages: ${messagesDeleteResult.deletedCount} deleted`);
            console.log(`- Safety Events: ${safetyEventsDeleteResult.deletedCount} deleted`);
        }
        catch (error) {
            console.error('[CleanupWorker] Error during cleanup:', error);
        }
    }
}
exports.CleanupWorker = CleanupWorker;
