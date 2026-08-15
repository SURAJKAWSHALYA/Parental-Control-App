import { Request, Response } from 'express';
import { Device } from '../models/Device';
import { Child } from '../models/Child';
import { getIo } from '../sockets/socketHandler';

export const syncPermissions = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { permissions } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Verify child owns the device (assuming req.user contains child auth, or we rely on token)
    // Actually, child device auth sets req.user to child.
    // If it's a child token, req.user.role === 'child'.
    if (req.user && req.user.role === 'child' && device.childId.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Unauthorized device access' });
    }

    device.permissions = permissions.map((p: any) => ({
      ...p,
      lastSynchronized: new Date()
    }));

    await device.save();

    // Notify parent
    getIo().to(`parent_${req.user?.parentId || 'unknown'}`).emit('permissions:updated', {
      deviceId,
      permissions: device.permissions
    });

    res.status(200).json({ success: true, data: device.permissions });
  } catch (error) {
    console.error('Error syncing permissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findById(deviceId).populate('childId');
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Verify parent owns the child that owns the device
    if (req.user && req.user.role === 'parent') {
      const child = await Child.findById(device.childId);
      if (!child || child.parentId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized device access' });
      }
    }

    res.status(200).json({ 
      success: true, 
      data: {
        permissions: device.permissions,
        notificationSettings: device.notificationSettings
      } 
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
