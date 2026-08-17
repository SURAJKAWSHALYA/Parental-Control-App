import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db';
import { apiLimiter, authLimiter, mediaLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
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
import analyticsRoutes from './routes/analytics.routes';
import searchRoutes from './routes/search.routes';
import deviceHealthRoutes from './routes/deviceHealth.routes';
import familyRoutes from './routes/family.routes';
import auditRoutes from './routes/audit.routes';
import intelligenceRoutes from './routes/intelligence.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import alertRulesRoutes from './routes/alertRules.routes';
import reportsRoutes from './routes/reports.routes';
import healthRoutes from './routes/health.routes';
import { startDataRetentionCron } from './jobs/dataRetentionJob';
import { env } from './config/env.config';
import { runMigrations } from './migrations/migrate';



// Connect to MongoDB and run migrations conditionally (tests handle it separately)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    return runMigrations();
  }).catch(err => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
}

const app = express();
const server = http.createServer(app);

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());

// Socket.io for Real-time communication (Phase 2 mostly, but setup here)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(requestIdMiddleware);
app.use(metricsMiddleware);

// Apply rate limiter to all /api/ routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
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
app.use('/api/media', mediaLimiter, mediaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/device-health', deviceHealthRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/alert-rules', alertRulesRoutes);
app.use('/api/advanced-reports', reportsRoutes); // Use a distinct path from existing /api/reports
app.use('/api/health', healthRoutes);

// Global Error Handler
app.use(errorHandler);

// Socket.io connection logic
setupSockets(io);

const PORT = env.PORT;

if (process.env.NODE_ENV !== 'test') {
  // Start background jobs
  startDataRetentionCron();

  server.listen(parseInt(PORT, 10), '0.0.0.0', () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT} (0.0.0.0)`);
  });
}

export { app, server };
