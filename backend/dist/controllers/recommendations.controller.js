"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dismissRecommendation = exports.getRecommendations = void 0;
const RecommendationService_1 = require("../services/RecommendationService");
const Recommendation_1 = require("../models/Recommendation");
const getRecommendations = async (req, res) => {
    try {
        const parentId = req.user?._id;
        const recommendations = await RecommendationService_1.RecommendationService.getActiveRecommendations(parentId);
        res.json({ success: true, data: recommendations });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getRecommendations = getRecommendations;
const dismissRecommendation = async (req, res) => {
    try {
        const { id } = req.params;
        const recommendation = await Recommendation_1.Recommendation.findOne({ _id: id, parentId: req.user?._id });
        if (!recommendation) {
            return res.status(404).json({ success: false, error: 'Recommendation not found' });
        }
        const updated = await RecommendationService_1.RecommendationService.dismissRecommendation(id);
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.dismissRecommendation = dismissRecommendation;
