import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { RecommendationService } from '../services/RecommendationService';
import { Recommendation } from '../models/Recommendation';

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user?._id;
    const recommendations = await RecommendationService.getActiveRecommendations(parentId);
    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const dismissRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const recommendation = await Recommendation.findOne({ _id: id, parentId: req.user?._id });
    if (!recommendation) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    const updated = await RecommendationService.dismissRecommendation(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
