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
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Socket.io connection logic
(0, socketHandler_1.setupSockets)(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
