"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const db_1 = require("./config/db");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const requestId_middleware_1 = require("./middleware/requestId.middleware");
const metrics_middleware_1 = require("./middleware/metrics.middleware");
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
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const dataRetentionJob_1 = require("./jobs/dataRetentionJob");
const env_config_1 = require("./config/env.config");
const migrate_1 = require("./migrations/migrate");
// Connect to MongoDB and run migrations conditionally (tests handle it separately)
if (process.env.NODE_ENV !== 'test') {
    (0, db_1.connectDB)().then(() => {
        return (0, migrate_1.runMigrations)();
    }).catch(err => {
        console.error("Startup failed:", err);
        process.exit(1);
    });
}
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// Socket.io for Real-time communication (Phase 2 mostly, but setup here)
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_config_1.env.CLIENT_URL,
        methods: ['GET', 'POST']
    }
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_config_1.env.CLIENT_URL }));
app.use(express_1.default.json());
app.use(requestId_middleware_1.requestIdMiddleware);
app.use(metrics_middleware_1.metricsMiddleware);
// Apply rate limiter to all /api/ routes
app.use('/api', rateLimiter_1.apiLimiter);
// API Routes
app.use('/api/auth', rateLimiter_1.authLimiter, auth_routes_1.default);
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
app.use('/api/media', rateLimiter_1.mediaLimiter, media_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/search', search_routes_1.default);
app.use('/api/device-health', deviceHealth_routes_1.default);
app.use('/api/family', family_routes_1.default);
app.use('/api/audit', audit_routes_1.default);
app.use('/api/intelligence', intelligence_routes_1.default);
app.use('/api/recommendations', recommendations_routes_1.default);
app.use('/api/alert-rules', alertRules_routes_1.default);
app.use('/api/advanced-reports', reports_routes_1.default); // Use a distinct path from existing /api/reports
app.use('/api/health', health_routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Socket.io connection logic
(0, socketHandler_1.setupSockets)(io);
const PORT = env_config_1.env.PORT;
if (process.env.NODE_ENV !== 'test') {
    // Start background jobs
    (0, dataRetentionJob_1.startDataRetentionCron)();
    server.listen(PORT, () => {
        console.log(`Server running in ${env_config_1.env.NODE_ENV} mode on port ${PORT}`);
    });
}
