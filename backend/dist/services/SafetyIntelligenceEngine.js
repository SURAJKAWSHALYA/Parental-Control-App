"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyIntelligenceEngine = void 0;
const SafetyEvent_1 = require("../models/SafetyEvent");
const WebsiteRule_1 = require("../models/WebsiteRule");
const DeviceHealth_1 = require("../models/DeviceHealth");
class SafetyIntelligenceEngine {
    /**
     * Calculates a normalized Safety Risk Score (0-100) based on multiple factors.
     * Note: This score is an informational indicator and NEVER a diagnosis.
     */
    static async calculateSafetyScore(childId) {
        try {
            const now = new Date();
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const [safetyEvents, websiteBlocks, deviceHealth] = await Promise.all([
                SafetyEvent_1.SafetyEvent.find({ childId, createdAt: { $gte: last7Days } }),
                WebsiteRule_1.WebsiteRule.find({ childId, isBlocked: true }), // Simulated blocks count could come from a history table
                DeviceHealth_1.DeviceHealth.findOne({ childId }).sort({ lastSeen: -1 }),
            ]);
            let score = 0;
            const factors = [];
            // Factor 1: Safety Events
            const highConfidenceEvents = safetyEvents.filter((e) => e.confidence && e.confidence >= 0.7);
            if (highConfidenceEvents.length > 0) {
                score += Math.min(highConfidenceEvents.length * 10, 40);
                factors.push(`${highConfidenceEvents.length} high-confidence safety events detected`);
            }
            const mediumConfidenceEvents = safetyEvents.filter((e) => e.confidence && e.confidence >= 0.4 && e.confidence < 0.7);
            if (mediumConfidenceEvents.length > 0) {
                score += Math.min(mediumConfidenceEvents.length * 5, 20);
                factors.push(`${mediumConfidenceEvents.length} potential medium-confidence signals`);
            }
            // Factor 2: Device Health (e.g., location disabled, permissions removed)
            if (deviceHealth) {
                if (deviceHealth.locationStatus === 'DISABLED') {
                    score += 15;
                    factors.push('Location tracking has been disabled');
                }
                if (deviceHealth.permissionStatus === 'MISSING') {
                    score += 15;
                    factors.push('Required device permissions are missing');
                }
            }
            // Normalize score to 100
            score = Math.min(score, 100);
            // Determine level
            let level = 'Low';
            if (score > 80)
                level = 'Critical';
            else if (score > 60)
                level = 'High';
            else if (score > 40)
                level = 'Elevated';
            else if (score > 20)
                level = 'Moderate';
            return { score, level, factors };
        }
        catch (error) {
            console.error('Safety Intelligence Engine failed:', error);
            // Fallback gracefully without crashing
            return { score: 0, level: 'Unknown', factors: ['AI service unavailable. Defaulting to safe state.'] };
        }
    }
    /**
     * Generates safety trend data for charts
     */
    static async getSafetyTrends(childId, days = 7) {
        try {
            const now = new Date();
            const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            // Aggregate safety events by day
            const events = await SafetyEvent_1.SafetyEvent.aggregate([
                { $match: { childId: childId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);
            return events.map((e) => ({ date: e._id, events: e.count }));
        }
        catch (error) {
            console.error('Failed to get safety trends:', error);
            return [];
        }
    }
}
exports.SafetyIntelligenceEngine = SafetyIntelligenceEngine;
