import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { setupSockets } from './sockets/socketHandler';

// Routes
import authRoutes from './routes/auth.routes';
import childrenRoutes from './routes/children.routes';
import pairingRoutes from './routes/pairing.routes';
import devicesRoutes from './routes/devices.routes';
import appUsageRoutes from './routes/appUsage.routes';
import appLimitRoutes from './routes/appLimit.routes';
import downtimeRoutes from './routes/downtime.routes';
import allowedAppRoutes from './routes/allowedApp.routes';
import activityRoutes from './routes/activity.routes';
import alertRoutes from './routes/alert.routes';
import websiteRulesRoutes from './routes/websiteRules.routes';
import locationRoutes from './routes/location.routes';
import placeRoutes from './routes/place.routes';
import geofenceRoutes from './routes/geofence.routes';
import reportRoutes from './routes/report.routes';
import permissionRoutes from './routes/permission.routes';
import notificationRoutes from './routes/notification.routes';
import communicationRoutes from './routes/communication.routes';
import safetyRoutes from './routes/safety.routes';
import chatRoutes from './routes/chat.routes';
import mediaRoutes from './routes/media.routes';
import { startDataRetentionCron } from './jobs/dataRetentionJob';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io for Real-time communication (Phase 2 mostly, but setup here)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Apply rate limiter to all /api/ routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/pairing', pairingRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/app-usage', appUsageRoutes);
app.use('/api/app-limits', appLimitRoutes);
app.use('/api/downtime', downtimeRoutes);
app.use('/api/allowed-apps', allowedAppRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/websites', websiteRulesRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/media', mediaRoutes);

// Global Error Handler
app.use(errorHandler);

// Socket.io connection logic
setupSockets(io);

const PORT = process.env.PORT || 5000;

// Start background jobs
startDataRetentionCron();

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
