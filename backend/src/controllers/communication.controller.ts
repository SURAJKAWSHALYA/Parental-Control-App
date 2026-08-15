import { Request, Response } from 'express';
import { Device } from '../models/Device';
import { Child } from '../models/Child';
import { CallRecord } from '../models/CallRecord';
import { SmsRecord } from '../models/SmsRecord';
import { Activity } from '../models/Activity';
import { SafetyEventService } from '../services/SafetyEventService';
import { getIo } from '../sockets/socketHandler';
import crypto from 'crypto';

const hashNumber = (num: string) => {
  return crypto.createHash('sha256').update(num).digest('hex').substring(0, 16);
};

export const syncCall = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { type, duration, timestamp, contactLabel, rawNumber } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    if (req.user && req.user.role === 'child' && device.childId.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Unauthorized device access' });
    }

    const numberHash = rawNumber ? hashNumber(rawNumber) : 'UNKNOWN';

    const record = new CallRecord({
      childId: device.childId,
      deviceId,
      type,
      duration: duration || 0,
      timestamp: timestamp || new Date(),
      contactLabel,
      numberHash
    });

    await record.save();

    // Log Activity
    const activity = new Activity({
      childId: device.childId,
      deviceId,
      type: 'CALL',
      title: `${type === 'INCOMING' ? 'Incoming' : type === 'OUTGOING' ? 'Outgoing' : 'Missed'} call`,
      description: `${type} call with ${contactLabel || 'Unknown'} (${duration || 0}s)`,
      metadata: { type, duration, contactLabel }
    });
    await activity.save();

    // Notify parent
    const child = await Child.findById(device.childId);
    if (child) {
      getIo().to(`parent_${child.parentId}`).emit('call:new', record);
      getIo().to(`parent_${child.parentId}`).emit('activity:new', activity);
    }

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error syncing call:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const syncSms = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { type, rawSender, fullMessage, timestamp } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    if (req.user && req.user.role === 'child' && device.childId.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Unauthorized device access' });
    }

    const senderHash = rawSender ? hashNumber(rawSender) : 'UNKNOWN';
    const messagePreview = fullMessage ? fullMessage.substring(0, 100) : '';

    const child = await Child.findById(device.childId);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    const { classification: safetyClassification } = await SafetyEventService.processTextEvent(
      child.parentId,
      child._id,
      deviceId,
      'SMS',
      fullMessage || '',
      `SMS Safety Alert`,
      'SMS Content',
      { senderHash }
    );

    const record = new SmsRecord({
      childId: device.childId,
      deviceId,
      type,
      senderHash,
      messagePreview,
      timestamp: timestamp || new Date(),
      safetyClassification
    });

    await record.save();

    // Log Activity
    const activity = new Activity({
      childId: device.childId,
      deviceId,
      type: 'SMS',
      title: `${type === 'INCOMING' ? 'Incoming' : 'Outgoing'} SMS`,
      description: `SMS ${type === 'INCOMING' ? 'received' : 'sent'}`,
      metadata: { type, safetyCategory: safetyClassification.category }
    });
    await activity.save();

    getIo().to(`parent_${child.parentId}`).emit('sms:new', record);
    getIo().to(`parent_${child.parentId}`).emit('activity:new', activity);

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error syncing SMS:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCalls = async (req: Request, res: Response) => {
  try {
    const { childId, deviceId, type, days } = req.query;
    
    // verify parent ownership
    if (childId) {
      const child = await Child.findById(childId);
      if (!child || child.parentId.toString() !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    } else {
      const children = await Child.find({ parentId: req.user?.id });
      const childIds = children.map(c => c._id);
      req.query.childId = { $in: childIds } as any;
    }

    const filter: any = {};
    if (req.query.childId) filter.childId = req.query.childId;
    if (deviceId) filter.deviceId = deviceId;
    if (type && type !== 'All') filter.type = type;

    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days as string));
      filter.timestamp = { $gte: date };
    }

    const calls = await CallRecord.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('childId', 'name')
      .populate('deviceId', 'deviceName');

    res.status(200).json({ success: true, data: calls });
  } catch (error) {
    console.error('Error getting calls:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSms = async (req: Request, res: Response) => {
  try {
    const { childId, deviceId, type, safetyStatus, days } = req.query;
    
    if (childId) {
      const child = await Child.findById(childId);
      if (!child || child.parentId.toString() !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    } else {
      const children = await Child.find({ parentId: req.user?.id });
      const childIds = children.map(c => c._id);
      req.query.childId = { $in: childIds } as any;
    }

    const filter: any = {};
    if (req.query.childId) filter.childId = req.query.childId;
    if (deviceId) filter.deviceId = deviceId;
    if (type && type !== 'All') filter.type = type;
    
    if (safetyStatus && safetyStatus !== 'All') {
      if (safetyStatus === 'Flagged') {
        filter['safetyClassification.severity'] = { $in: ['MEDIUM', 'HIGH'] };
      } else {
        filter['safetyClassification.category'] = safetyStatus;
      }
    }

    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days as string));
      filter.timestamp = { $gte: date };
    }

    const sms = await SmsRecord.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('childId', 'name')
      .populate('deviceId', 'deviceName');

    res.status(200).json({ success: true, data: sms });
  } catch (error) {
    console.error('Error getting SMS:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
