"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const Recommendation_1 = require("../models/Recommendation");
const AppUsage_1 = require("../models/AppUsage");
const mongoose_1 = __importDefault(require("mongoose"));
class RecommendationService {
    static async evaluateScreenTime(childId, parentId) {
        try {
            const now = new Date();
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
            // Simplified comparison
            const recentUsage = await AppUsage_1.AppUsage.aggregate([
                { $match: { childId: new mongoose_1.default.Types.ObjectId(childId), timestamp: { $gte: lastWeek } } },
                { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
            ]);
            const previousUsage = await AppUsage_1.AppUsage.aggregate([
                { $match: { childId: new mongoose_1.default.Types.ObjectId(childId), timestamp: { $gte: twoWeeksAgo, $lt: lastWeek } } },
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
        }
        catch (error) {
            console.error('Failed to evaluate screen time recommendations:', error);
        }
    }
    static async createRecommendation(data) {
        // Deduplicate: Don't create if a similar NEW recommendation exists
        const existing = await Recommendation_1.Recommendation.findOne({
            childId: data.childId,
            type: data.type,
            status: 'NEW'
        });
        if (existing)
            return existing;
        const recommendation = new Recommendation_1.Recommendation({
            ...data,
            status: 'NEW'
        });
        await recommendation.save();
        return recommendation;
    }
    static async dismissRecommendation(id) {
        return Recommendation_1.Recommendation.findByIdAndUpdate(id, { status: 'DISMISSED', dismissedAt: new Date() }, { new: true });
    }
    static async getActiveRecommendations(parentId) {
        return Recommendation_1.Recommendation.find({ parentId, status: 'NEW' }).sort({ createdAt: -1 });
    }
}
exports.RecommendationService = RecommendationService;
