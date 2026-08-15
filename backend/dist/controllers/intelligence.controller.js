"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafetyTrends = exports.getSafetyScore = void 0;
const SafetyIntelligenceEngine_1 = require("../services/SafetyIntelligenceEngine");
const Child_1 = require("../models/Child");
const getSafetyScore = async (req, res) => {
    try {
        const { childId } = req.params;
        // Verify ownership
        const child = await Child_1.Child.findOne({ _id: childId, parentId: req.user?._id });
        if (!child) {
            return res.status(404).json({ success: false, error: 'Child not found' });
        }
        const { score, level, factors } = await SafetyIntelligenceEngine_1.SafetyIntelligenceEngine.calculateSafetyScore(childId);
        res.json({ success: true, data: { score, level, factors } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getSafetyScore = getSafetyScore;
const getSafetyTrends = async (req, res) => {
    try {
        const { childId } = req.params;
        const { days } = req.query;
        const child = await Child_1.Child.findOne({ _id: childId, parentId: req.user?._id });
        if (!child) {
            return res.status(404).json({ success: false, error: 'Child not found' });
        }
        const trends = await SafetyIntelligenceEngine_1.SafetyIntelligenceEngine.getSafetyTrends(childId, Number(days) || 7);
        res.json({ success: true, data: trends });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getSafetyTrends = getSafetyTrends;
