"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const db_1 = require("./config/db");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const socketHandler_1 = require("./sockets/socketHandler");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const children_routes_1 = __importDefault(require("./routes/children.routes"));
const pairing_routes_1 = __importDefault(require("./routes/pairing.routes"));
const devices_routes_1 = __importDefault(require("./routes/devices.routes"));
const appUsage_routes_1 = __importDefault(require("./routes/appUsage.routes"));
const appLimit_routes_1 = __importDefault(require("./routes/appLimit.routes"));
const downtime_routes_1 = __importDefault(require("./routes/downtime.routes"));
const allowedApp_routes_1 = __importDefault(require("./routes/allowedApp.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const alert_routes_1 = __importDefault(require("./routes/alert.routes"));
const websiteRules_routes_1 = __importDefault(require("./routes/websiteRules.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const place_routes_1 = __importDefault(require("./routes/place.routes"));
const geofence_routes_1 = __importDefault(require("./routes/geofence.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const permission_routes_1 = __importDefault(require("./routes/permission.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const communication_routes_1 = __importDefault(require("./routes/communication.routes"));
const safety_routes_1 = __importDefault(require("./routes/safety.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const deviceHealth_routes_1 = __importDefault(require("./routes/deviceHealth.routes"));
const family_routes_1 = __importDefault(require("./routes/family.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const intelligence_routes_1 = __importDefault(require("./routes/intelligence.routes"));
const recommendations_routes_1 = __importDefault(require("./routes/recommendations.routes"));
const alertRules_routes_1 = __importDefault(require("./routes/alertRules.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const dataRetentionJob_1 = require("./jobs/dataRetentionJob");
dotenv_1.default.config();
// Connect to MongoDB
(0, db_1.connectDB)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Socket.io for Real-time communication (Phase 2 mostly, but setup here)
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express_1.default.json());
// Apply rate limiter to all /api/ routes
app.use('/api', rateLimiter_1.apiLimiter);
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/children', children_routes_1.default);
app.use('/api/pairing', pairing_routes_1.default);
app.use('/api/devices', devices_routes_1.default);
app.use('/api/app-usage', appUsage_routes_1.default);
app.use('/api/app-limits', appLimit_routes_1.default);
app.use('/api/downtime', downtime_routes_1.default);
app.use('/api/allowed-apps', allowedApp_routes_1.default);
app.use('/api/activity', activity_routes_1.default);
app.use('/api/alerts', alert_routes_1.default);
app.use('/api/websites', websiteRules_routes_1.default);
app.use('/api/location', location_routes_1.default);
app.use('/api/places', place_routes_1.default);
app.use('/api/geofences', geofence_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/permissions', permission_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/communication', communication_routes_1.default);
app.use('/api/safety', safety_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/media', media_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/search', search_routes_1.default);
app.use('/api/device-health', deviceHealth_routes_1.default);
app.use('/api/family', family_routes_1.default);
app.use('/api/audit', audit_routes_1.default);
app.use('/api/intelligence', intelligence_routes_1.default);
app.use('/api/recommendations', recommendations_routes_1.default);
app.use('/api/alert-rules', alertRules_routes_1.default);
app.use('/api/advanced-reports', reports_routes_1.default); // Use a distinct path from existing /api/reports
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Socket.io connection logic
(0, socketHandler_1.setupSockets)(io);
const PORT = process.env.PORT || 5000;
// Start background jobs
(0, dataRetentionJob_1.startDataRetentionCron)();
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
