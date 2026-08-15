"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendData = exports.getChildOverview = exports.getFamilyInsights = exports.getFamilySummary = void 0;
const AnalyticsService_1 = require("../services/AnalyticsService");
const getFamilySummary = async (req, res) => {
    try {
        const parentId = req.user.id;
        const summary = await AnalyticsService_1.AnalyticsService.getFamilySummary(parentId);
        res.json({ success: true, data: summary });
    }
    catch (error) {
        console.error('Error fetching family summary:', error);
        res.status(500).json({ success: false, message: 'Server error fetching family summary' });
    }
};
exports.getFamilySummary = getFamilySummary;
const getFamilyInsights = async (req, res) => {
    try {
        const parentId = req.user.id;
        const insights = await AnalyticsService_1.AnalyticsService.getFamilyInsights(parentId);
        res.json({ success: true, data: insights });
    }
    catch (error) {
        console.error('Error fetching family insights:', error);
        res.status(500).json({ success: false, message: 'Server error fetching family insights' });
    }
};
exports.getFamilyInsights = getFamilyInsights;
const getChildOverview = async (req, res) => {
    try {
        const { childId } = req.params;
        const overview = await AnalyticsService_1.AnalyticsService.getChildOverview(childId);
        res.json({ success: true, data: overview });
    }
    catch (error) {
        console.error('Error fetching child overview:', error);
        res.status(500).json({ success: false, message: 'Server error fetching child overview' });
    }
};
exports.getChildOverview = getChildOverview;
const getTrendData = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { type, days } = req.query;
        if (!type || !days) {
            return res.status(400).json({ success: false, message: 'type and days query parameters are required' });
        }
        const parsedDays = parseInt(days, 10);
        const data = await AnalyticsService_1.AnalyticsService.getTrendData(parentId, type, parsedDays);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error fetching trend data:', error);
        res.status(500).json({ success: false, message: 'Server error fetching trend data' });
    }
};
exports.getTrendData = getTrendData;
