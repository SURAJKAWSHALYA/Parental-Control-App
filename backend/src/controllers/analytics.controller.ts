import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

export const getFamilySummary = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.id;
    const summary = await AnalyticsService.getFamilySummary(parentId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching family summary:', error);
    res.status(500).json({ success: false, message: 'Server error fetching family summary' });
  }
};

export const getFamilyInsights = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.id;
    const insights = await AnalyticsService.getFamilyInsights(parentId);
    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('Error fetching family insights:', error);
    res.status(500).json({ success: false, message: 'Server error fetching family insights' });
  }
};

export const getChildOverview = async (req: Request, res: Response) => {
  try {
    const { childId } = req.params;
    const overview = await AnalyticsService.getChildOverview(childId);
    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Error fetching child overview:', error);
    res.status(500).json({ success: false, message: 'Server error fetching child overview' });
  }
};

export const getTrendData = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.id;
    const { type, days } = req.query;
    
    if (!type || !days) {
      return res.status(400).json({ success: false, message: 'type and days query parameters are required' });
    }

    const parsedDays = parseInt(days as string, 10);
    const data = await AnalyticsService.getTrendData(parentId, type as any, parsedDays);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching trend data' });
  }
};
