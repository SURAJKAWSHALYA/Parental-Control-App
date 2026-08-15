import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Device } from '../models/Device';
import { Child } from '../models/Child';
import { CommandAudit } from '../models/CommandAudit';
import { Alert } from '../models/Alert';
import { Activity } from '../models/Activity';

interface AuthSocket extends Socket {
  user?: any; // parent or device object
}

let ioInstance: Server;

export const getIo = () => ioInstance;

export const setupSockets = (io: Server) => {
  ioInstance = io;
  // Middleware for authentication
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
      if (!token) return next(new Error('Authentication error: Token missing'));

      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET as string) as any;
      
      if (decoded.role === 'device') {
        socket.user = { role: 'device', deviceId: decoded.id, childId: decoded.childId };
      } else {
        socket.user = { role: 'parent', parentId: decoded.id };
      }
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.id} (${socket.user?.role})`);

    // Join rooms based on role
    if (socket.user?.role === 'parent') {
      const parentRoom = `parent_${socket.user.parentId}`;
      socket.join(parentRoom);
    } else if (socket.user?.role === 'device') {
      const deviceRoom = `device_${socket.user.deviceId}`;
      socket.join(deviceRoom);
      
      // Update device to online and notify parent
      updateDeviceStatus(socket.user.deviceId, true).then(device => {
        if (device) {
          // Assuming device model populated with child info, or we can look up parent
          Child.findById(device.childId).then(child => {
            if (child) {
              io.to(`parent_${child.parentId}`).emit('device:online', { deviceId: device._id, lastSeen: new Date() });
            }
          });
        }
      });
    }

    // Handle heartbeats (if coming over socket instead of REST)
    socket.on('device:heartbeat', async (data) => {
      if (socket.user?.role === 'device') {
         await updateDeviceStatus(socket.user.deviceId, true, data.batteryLevel);
      }
    });

    // Parent Command Execution
    socket.on('parent:command', async (data, callback) => {
      if (socket.user?.role !== 'parent') return;
      
      try {
        const { childId, deviceId, commandType } = data;
        
        // Verify parent owns child and child owns device
        const child = await Child.findOne({ _id: childId, parentId: socket.user.parentId });
        if (!child) throw new Error('Unauthorized child');
        
        const device = await Device.findOne({ _id: deviceId, childId: child._id });
        if (!device) throw new Error('Unauthorized device');
        
        // Log command
        const command = await CommandAudit.create({
          parentId: socket.user.parentId,
          childId,
          deviceId,
          commandId: `cmd_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          commandType,
          result: 'PENDING'
        });

        // Emit to device
        io.to(`device_${deviceId}`).emit('parent:command', { commandId: command.commandId, commandType });
        
        if (callback) callback({ success: true, commandId: command.commandId });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id} (${socket.user?.role})`);
      if (socket.user?.role === 'device') {
        const device = await updateDeviceStatus(socket.user.deviceId, false);
        if (device) {
          const child = await Child.findById(device.childId);
          if (child) {
            io.to(`parent_${child.parentId}`).emit('device:offline', { deviceId: device._id, lastSeen: new Date() });
          }
        }
      }
    });

    // Handle App Limit events from Device (e.g. limit reached, usage updated)
    socket.on('device:usage:updated', async (data) => {
      if (socket.user?.role === 'device') {
        const device = await Device.findById(socket.user.deviceId);
        if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('device:usage:updated', { deviceId: device._id, ...data });
           }
        }
      }
    });

    socket.on('restriction:updated', async (data) => {
      if (socket.user?.role === 'device') {
        const device = await Device.findById(socket.user.deviceId);
        if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('restriction:updated', { deviceId: device._id, ...data });
           }
        }
      }
    });

    socket.on('website:rules:sync', async (data) => {
      if (socket.user?.role === 'device') {
        const device = await Device.findById(socket.user.deviceId);
        if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('website:rules:sync', { deviceId: device._id, message: 'Rules synchronized', ...data });
           }
        }
      }
    });

    // Location Events
    socket.on('location:updated', async (data) => {
      if (socket.user?.role === 'device') {
        const device = await Device.findById(socket.user.deviceId);
        if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('location:updated', { deviceId: device._id, ...data });
           }
        }
      }
    });

    socket.on('location:permission-changed', async (data) => {
      if (socket.user?.role === 'device') {
        const device = await Device.findById(socket.user.deviceId);
        if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('location:permission-changed', { deviceId: device._id, ...data });
             
             if (data.status === 'disabled' || data.status === 'denied') {
               // Generate an alert
               const alert = await Alert.create({
                 parentId: child.parentId,
                 childId: child._id,
                 deviceId: device._id,
                 type: 'LOCATION_DISABLED',
                 title: 'Location Permission Disabled',
                 message: `${child.name}'s device is no longer providing location updates.`,
                 severity: 'HIGH',
               });
               io.to(`parent_${child.parentId}`).emit('alert:new', alert);
             }
           }
        }
      }
    });

    socket.on('alert:new', async (data) => {
      if (socket.user?.role === 'device') {
        const device = await Device.findById(socket.user.deviceId);
        if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             // Deduplication: Check if similar unread alert exists within last 15 mins
             const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
             const existing = await Alert.findOne({
               deviceId: device._id,
               type: data.type,
               isRead: false,
               createdAt: { $gte: fifteenMinsAgo }
             });

             if (!existing) {
               const alert = await Alert.create({
                 parentId: child.parentId,
                 childId: child._id,
                 deviceId: device._id,
                 type: data.type,
                 title: data.title,
                 message: data.message,
                 severity: data.severity || 'MEDIUM',
               });
               io.to(`parent_${child.parentId}`).emit('alert:new', alert);
             }
           }
        }
      }
    });

    socket.on('activity:new', async (data) => {
      if (socket.user?.role === 'device') {
        const device = await Device.findById(socket.user.deviceId);
        if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             const activity = await Activity.create({
               childId: child._id,
               deviceId: device._id,
               type: data.type,
               title: data.title,
               description: data.description,
               metadata: data.metadata,
             });
             io.to(`parent_${child.parentId}`).emit('activity:new', activity);
           }
        }
      }
    });

    // Chat Events
    socket.on('chat:typing', async (data) => {
      const { conversationId, receiverId } = data;
      if (socket.user?.role === 'parent') {
         io.to(`device_${receiverId}`).emit('chat:typing', { conversationId });
      } else if (socket.user?.role === 'device') {
         const device = await Device.findById(socket.user.deviceId);
         if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('chat:typing', { conversationId, childId: child._id });
           }
         }
      }
    });

    socket.on('chat:stopTyping', async (data) => {
      const { conversationId, receiverId } = data;
      if (socket.user?.role === 'parent') {
         io.to(`device_${receiverId}`).emit('chat:stopTyping', { conversationId });
      } else if (socket.user?.role === 'device') {
         const device = await Device.findById(socket.user.deviceId);
         if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('chat:stopTyping', { conversationId, childId: child._id });
           }
         }
      }
    });

    socket.on('chat:message:delivered', async (data) => {
       const { messageId, conversationId, deviceId } = data;
       if (socket.user?.role === 'device') {
         const device = await Device.findById(socket.user.deviceId);
         if (device) {
           const child = await Child.findById(device.childId);
           if (child) {
             io.to(`parent_${child.parentId}`).emit('chat:message:delivered', { messageId, conversationId });
           }
         }
       } else if (socket.user?.role === 'parent' && deviceId) {
          io.to(`device_${deviceId}`).emit('chat:message:delivered', { messageId, conversationId });
       }
    });
  });
};

async function updateDeviceStatus(deviceId: string, isOnline: boolean, batteryLevel?: number) {
  try {
    const update: any = { isOnline, lastSeen: new Date() };
    if (batteryLevel !== undefined) update.batteryLevel = batteryLevel;
    
    return await Device.findByIdAndUpdate(deviceId, update, { new: true });
  } catch (error) {
    console.error('Error updating device status', error);
    return null;
  }
}
