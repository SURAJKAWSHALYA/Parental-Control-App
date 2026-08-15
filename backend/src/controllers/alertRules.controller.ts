import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AlertRule } from '../models/AlertRule';

export const getAlertRules = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    
    // Find child specific rules and global rules (childId = null) for this parent
    const rules = await AlertRule.find({
      parentId: req.user?._id,
      $or: [{ childId }, { childId: { $exists: false } }]
    });

    res.json({ success: true, data: rules });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAlertRule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled, cooldownMinutes, quietHours } = req.body;
    
    const rule = await AlertRule.findOneAndUpdate(
      { _id: id, parentId: req.user?._id },
      { enabled, cooldownMinutes, quietHours },
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({ success: false, error: 'Alert rule not found' });
    }

    res.json({ success: true, data: rule });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
