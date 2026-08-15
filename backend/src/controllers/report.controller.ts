import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { Activity } from '../models/Activity';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { Place } from '../models/Place';
import { WebsiteRule } from '../models/WebsiteRule';
import { SafetyEvent } from '../models/SafetyEvent';
import { CallRecord } from '../models/CallRecord';
import { SmsRecord } from '../models/SmsRecord';
import { NotificationRecord } from '../models/NotificationRecord';
import { Message } from '../models/Message';
import { MediaAsset } from '../models/MediaAsset';
import { Conversation } from '../models/Conversation';

export const getWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.query;

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);

    const deviceQuery: any = { childId: { $in: childIds } };
    if (deviceId) deviceQuery._id = deviceId;
    
    const devices = await Device.find(deviceQuery);
    if (!devices.length) return sendError(res, 'No devices found or unauthorized', 'NOT_FOUND', 404);
    
    const targetDeviceIds = devices.map(d => d._id);

    // Date calculations for "Weekly" report (Last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Aggregate Location Activity (Number of updates)
    const locationUpdates = await Activity.countDocuments({
      deviceId: { $in: targetDeviceIds },
      type: 'LOCATION',
      timestamp: { $gte: startDate, $lte: endDate }
    });

    // Aggregate Geofence Activity
    const geofenceEvents = await Activity.countDocuments({
      deviceId: { $in: targetDeviceIds },
      type: 'GEOFENCE',
      timestamp: { $gte: startDate, $lte: endDate }
    });

    // Aggregate Places visited (distinct placeIds from geofence metadata)
    const geofenceActivities = await Activity.find({
      deviceId: { $in: targetDeviceIds },
      type: 'GEOFENCE',
      timestamp: { $gte: startDate, $lte: endDate }
    });
    const uniquePlaces = new Set(geofenceActivities.map(a => a.metadata?.placeId));
    const placesVisitedCount = uniquePlaces.size;

    // Aggregate Website blocks
    const blockedWebsites = await Activity.countDocuments({
      deviceId: { $in: targetDeviceIds },
      type: 'WEBSITE',
      'metadata.action': 'BLOCKED',
      timestamp: { $gte: startDate, $lte: endDate }
    });

    const reportData = {
      period: '7 Days',
      startDate,
      endDate,
      statistics: {
        locationUpdates,
        placesVisited: placesVisitedCount,
        geofenceEvents,
        blockedWebsites
      }
    };

    sendSuccess(res, reportData, 'Weekly report generated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getSafetyReport = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { days = '7' } = req.query;

    const device = await Device.findOne({ _id: deviceId }).populate('childId');
    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const child: any = device.childId;
    if (child.parentId.toString() !== parentId.toString()) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 403);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const events = await SafetyEvent.find({
      deviceId,
      timestamp: { $gte: startDate }
    });

    const summary = {
      total: events.length,
      CRITICAL: events.filter(e => e.severity === 'CRITICAL').length,
      HIGH: events.filter(e => e.severity === 'HIGH').length,
      MEDIUM: events.filter(e => e.severity === 'MEDIUM').length,
      LOW: events.filter(e => e.severity === 'LOW').length,
    };

    sendSuccess(res, summary, 'Safety report generated');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getCommunicationReport = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { days = '7' } = req.query;

    const device = await Device.findOne({ _id: deviceId }).populate('childId');
    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const child: any = device.childId;
    if (child.parentId.toString() !== parentId.toString()) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 403);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const query = { deviceId, timestamp: { $gte: startDate } };

    const [calls, sms, notifications] = await Promise.all([
      CallRecord.countDocuments(query),
      SmsRecord.countDocuments(query),
      NotificationRecord.countDocuments(query)
    ]);

    const summary = {
      calls,
      sms,
      notifications
    };

    sendSuccess(res, summary, 'Communication report generated');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getFamilyCommunicationReport = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { childId } = req.params;
    const { days = '7' } = req.query;

    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) return sendError(res, 'Child not found or unauthorized', 'UNAUTHORIZED', 403);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Get conversation for child
    const conversation = await Conversation.findOne({ parentId, childId });
    if (!conversation) {
      return sendSuccess(res, { messages: 0, photos: 0, videos: 0, safetyEvents: 0, flaggedMedia: 0 }, 'No conversation');
    }

    const conversationId = conversation._id;

    // Messages query
    const [messagesSent, messagesReceived, photos, videos, flaggedMessages, flaggedMedia, safetyEvents] = await Promise.all([
      Message.countDocuments({ conversationId, senderType: 'Child', createdAt: { $gte: startDate } }),
      Message.countDocuments({ conversationId, senderType: 'Parent', createdAt: { $gte: startDate } }),
      MediaAsset.countDocuments({ conversationId, type: 'IMAGE', createdAt: { $gte: startDate } }),
      MediaAsset.countDocuments({ conversationId, type: 'VIDEO', createdAt: { $gte: startDate } }),
      Message.countDocuments({ conversationId, safetyStatus: 'FLAGGED', createdAt: { $gte: startDate } }),
      MediaAsset.countDocuments({ conversationId, safetyStatus: 'FLAGGED', createdAt: { $gte: startDate } }),
      SafetyEvent.countDocuments({ 
        childId, 
        source: { $in: ['FAMILY_CHAT_MESSAGE', 'FAMILY_CHAT_MEDIA'] },
        timestamp: { $gte: startDate }
      })
    ]);

    const summary = {
      messages: messagesSent + messagesReceived,
      messagesSent,
      messagesReceived,
      photos,
      videos,
      safetyEvents,
      flaggedMessages,
      flaggedMedia
    };

    sendSuccess(res, summary, 'Family Communication report generated');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
