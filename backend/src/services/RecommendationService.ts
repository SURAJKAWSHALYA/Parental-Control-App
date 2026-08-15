import { Recommendation } from '../models/Recommendation';
import { AppUsage } from '../models/AppUsage';
import mongoose from 'mongoose';

export class RecommendationService {
  static async evaluateScreenTime(childId: string, parentId: string) {
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Simplified comparison
      const recentUsage = await AppUsage.aggregate([
        { $match: { childId: new mongoose.Types.ObjectId(childId), timestamp: { $gte: lastWeek } } },
        { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
      ]);

      const previousUsage = await AppUsage.aggregate([
        { $match: { childId: new mongoose.Types.ObjectId(childId), timestamp: { $gte: twoWeeksAgo, $lt: lastWeek } } },
        { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
      ]);

      const recentTotal = recentUsage[0]?.total || 0;
      const previousTotal = previousUsage[0]?.total || 0;

      if (previousTotal > 0 && recentTotal > previousTotal * 1.35) { // 35% increase
        await this.createRecommendation({
          parentId,
          childId,
          type: 'SCREEN_TIME',
          title: 'Screen Time Increased',
          description: 'Overall screen time increased by over 35% this week. Consider reviewing app limits.',
          priority: 'MEDIUM',
          source: 'Screen Time Analytics'
        });
      }
    } catch (error) {
      console.error('Failed to evaluate screen time recommendations:', error);
    }
  }

  static async createRecommendation(data: {
    parentId: string;
    childId: string;
    deviceId?: string;
    type: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    source: string;
  }) {
    // Deduplicate: Don't create if a similar NEW recommendation exists
    const existing = await Recommendation.findOne({
      childId: data.childId,
      type: data.type,
      status: 'NEW'
    });

    if (existing) return existing;

    const recommendation = new Recommendation({
      ...data,
      status: 'NEW'
    });

    await recommendation.save();
    return recommendation;
  }

  static async dismissRecommendation(id: string) {
    return Recommendation.findByIdAndUpdate(id, { status: 'DISMISSED', dismissedAt: new Date() }, { new: true });
  }

  static async getActiveRecommendations(parentId: string) {
    return Recommendation.find({ parentId, status: 'NEW' }).sort({ createdAt: -1 });
  }
}
