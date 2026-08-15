import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SafetyIntelligenceEngine } from '../services/SafetyIntelligenceEngine';
import { Child } from '../models/Child';

export const getSafetyScore = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    
    // Verify ownership
    const child = await Child.findOne({ _id: childId, parentId: req.user?._id });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    const { score, level, factors } = await SafetyIntelligenceEngine.calculateSafetyScore(childId);
    
    res.json({ success: true, data: { score, level, factors } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSafetyTrends = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const { days } = req.query;
    
    const child = await Child.findOne({ _id: childId, parentId: req.user?._id });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    const trends = await SafetyIntelligenceEngine.getSafetyTrends(childId, Number(days) || 7);
    
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
