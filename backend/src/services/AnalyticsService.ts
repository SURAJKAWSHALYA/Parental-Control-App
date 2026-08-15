import mongoose from 'mongoose';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { AppUsage } from '../models/AppUsage';
import { SafetyEvent } from '../models/SafetyEvent';
import { Activity } from '../models/Activity';
import { Message } from '../models/Message';

export class AnalyticsService {
  /**
   * Retrieves summary cards data for a parent's dashboard.
   */
  static async getFamilySummary(parentId: string) {
    const pId = new mongoose.Types.ObjectId(parentId);

    // 1. Get total children
    const childrenCount = await Child.countDocuments({ parentId: pId });

    // 2. Get active devices
    const devicesCount = await Device.countDocuments({ parentId: pId });

    // 3. Get active safety alerts (unread)
    const safetyAlerts = await SafetyEvent.countDocuments({ parentId: pId, isRead: false });

    // 4. Get today's total screen time (across all children and devices)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const screenTimeAggr = await AppUsage.aggregate([
      {
        $lookup: {
          from: 'children',
          localField: 'childId',
          foreignField: '_id',
          as: 'child'
        }
      },
      { $unwind: '$child' },
      {
        $match: {
          'child.parentId': pId,
          usageDate: { $gte: startOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$usageDuration' }
        }
      }
    ]);

    const screenTimeMs = screenTimeAggr.length > 0 ? screenTimeAggr[0].totalDuration : 0;
    const hours = Math.floor(screenTimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((screenTimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const screenTimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      childrenCount,
      devicesCount,
      safetyAlerts,
      screenTime: screenTimeStr,
      screenTimeMs
    };
  }

  /**
   * Generates Family Insights (comparison between children)
   */
  static async getFamilyInsights(parentId: string) {
    const pId = new mongoose.Types.ObjectId(parentId);
    const children = await Child.find({ parentId: pId }).select('firstName lastName _id');

    if (children.length === 0) return [];

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const insights = [];

    for (const child of children) {
      const childId = child._id;
      
      const screenTimeAggr = await AppUsage.aggregate([
        { $match: { childId, usageDate: { $gte: startOfDay } } },
        { $group: { _id: null, totalDuration: { $sum: '$usageDuration' } } }
      ]);
      const stMs = screenTimeAggr.length > 0 ? screenTimeAggr[0].totalDuration : 0;
      const h = Math.floor(stMs / (1000 * 60 * 60));
      const m = Math.floor((stMs % (1000 * 60 * 60)) / (1000 * 60));
      
      const appsUsed = await AppUsage.distinct('packageName', { childId, usageDate: { $gte: startOfDay } });

      const blockedWebsites = await Activity.countDocuments({
        childId,
        type: 'WEB_VISIT',
        'metadata.isBlocked': true,
        timestamp: { $gte: startOfDay }
      });

      const safetyEvents = await SafetyEvent.countDocuments({ childId, timestamp: { $gte: startOfDay } });

      const messages = await Message.countDocuments({ senderId: childId, timestamp: { $gte: startOfDay } });

      insights.push({
        childId: child._id,
        name: child.firstName,
        screenTime: h > 0 ? `${h}h ${m}m` : `${m}m`,
        appsUsedCount: appsUsed.length,
        websitesBlocked: blockedWebsites,
        safetyEvents,
        messages
      });
    }

    return insights;
  }

  /**
   * Retrieves child-specific overview
   */
  static async getChildOverview(childId: string) {
    const cId = new mongoose.Types.ObjectId(childId);
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const screenTimeAggr = await AppUsage.aggregate([
      { $match: { childId: cId, usageDate: { $gte: startOfDay } } },
      { $group: { _id: null, totalDuration: { $sum: '$usageDuration' } } }
    ]);
    const stMs = screenTimeAggr.length > 0 ? screenTimeAggr[0].totalDuration : 0;
    const h = Math.floor(stMs / (1000 * 60 * 60));
    const m = Math.floor((stMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const appsUsed = await AppUsage.distinct('packageName', { childId: cId, usageDate: { $gte: startOfDay } });

    const blockedWebsites = await Activity.countDocuments({
      childId: cId,
      type: 'WEB_VISIT',
      'metadata.isBlocked': true,
      timestamp: { $gte: startOfDay }
    });

    const latestLocationActivity = await Activity.findOne({ childId: cId, type: 'LOCATION_CHANGE' }).sort({ timestamp: -1 });

    const safetyAlerts = await SafetyEvent.countDocuments({ childId: cId, status: { $ne: 'RESOLVED' } });

    const messages = await Message.countDocuments({
      $or: [{ senderId: cId }, { receiverId: cId }],
      timestamp: { $gte: startOfDay }
    });

    return {
      childId,
      screenTime: h > 0 ? `${h}h ${m}m` : `${m}m`,
      appsCount: appsUsed.length,
      websitesBlocked: blockedWebsites,
      location: latestLocationActivity ? latestLocationActivity.title : 'Unknown',
      safetyAlerts,
      messages
    };
  }

  /**
   * Retrieves trend data for charts (7, 30, 90 days)
   */
  static async getTrendData(parentId: string, type: 'screen_time' | 'safety' | 'communication', days: number) {
    const pId = new mongoose.Types.ObjectId(parentId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const children = await Child.find({ parentId: pId }).select('_id');
    const childIds = children.map(c => c._id);

    if (type === 'screen_time') {
      const aggr = await AppUsage.aggregate([
        { $match: { childId: { $in: childIds }, usageDate: { $gte: startDate } } },
        { 
          $group: { 
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$usageDate' } }, 
            totalDuration: { $sum: '$usageDuration' } 
          } 
        },
        { $sort: { _id: 1 } }
      ]);
      return aggr.map(item => ({
        date: item._id,
        hours: parseFloat((item.totalDuration / (1000 * 60 * 60)).toFixed(2))
      }));
    } else if (type === 'safety') {
      const aggr = await SafetyEvent.aggregate([
        { $match: { parentId: pId, timestamp: { $gte: startDate } } },
        { 
          $group: { 
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ]);
      return aggr.map(item => ({ date: item._id, count: item.count }));
    }
    
    return [];
  }
}
