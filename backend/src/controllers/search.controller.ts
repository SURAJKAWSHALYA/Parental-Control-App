import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { Activity } from '../models/Activity';
import { SafetyEvent } from '../models/SafetyEvent';
import { Message } from '../models/Message';

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
    }

    const pId = new mongoose.Types.ObjectId(parentId);
    const regex = new RegExp(q, 'i');

    const results = [];

    // 1. Search Children
    const children = await Child.find({ parentId: pId, $or: [{ firstName: regex }, { lastName: regex }] });
    children.forEach(c => results.push({ type: 'child', id: c._id, title: `${c.firstName} ${c.lastName}`, subtitle: 'Child Profile', url: `/children/${c._id}` }));
    const childIds = children.length > 0 ? children.map(c => c._id) : (await Child.find({ parentId: pId }).select('_id')).map(c => c._id);

    // 2. Search Devices
    const devices = await Device.find({ parentId: pId, $or: [{ name: regex }, { deviceModel: regex }] });
    devices.forEach(d => results.push({ type: 'device', id: d._id, title: d.name, subtitle: d.deviceModel || 'Device', url: `/devices` }));

    // 3. Search Activity
    const activities = await Activity.find({ childId: { $in: childIds }, $or: [{ title: regex }, { description: regex }] }).limit(10).sort({ timestamp: -1 });
    activities.forEach(a => results.push({ type: 'activity', id: a._id, title: a.title, subtitle: a.description, url: `/activity` }));

    // 4. Search Safety Events
    const safetyEvents = await SafetyEvent.find({ parentId: pId, $or: [{ title: regex }, { description: regex }, { category: regex }] }).limit(10).sort({ timestamp: -1 });
    safetyEvents.forEach(s => results.push({ type: 'safety', id: s._id, title: s.title, subtitle: s.description, url: `/alerts` }));

    // 5. Search Messages (Family Chat)
    // For Family Chat, we might want to search text if the parent is part of the conversation. 
    // Just searching messages linked to parent or children
    const messages = await Message.find({ 
      $or: [{ senderId: { $in: [pId, ...childIds] } }, { receiverId: { $in: [pId, ...childIds] } }],
      content: regex
    }).limit(10).sort({ timestamp: -1 });
    messages.forEach(m => results.push({ type: 'message', id: m._id, title: 'Chat Message', subtitle: m.content?.substring(0, 50) + '...', url: `/chat` }));

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({ success: false, message: 'Server error during search' });
  }
};
