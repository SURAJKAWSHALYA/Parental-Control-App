"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.validateEnv = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before parsing
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    MONGODB_URI: zod_1.z.string().url().default('mongodb://127.0.0.1:27017/parental_control'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1).optional(),
    CLIENT_URL: zod_1.z.string().url().default('http://localhost:5173'),
    SOCKET_SECRET: zod_1.z.string().optional(),
    STORAGE_ENDPOINT: zod_1.z.string().optional(),
    STORAGE_BUCKET: zod_1.z.string().optional(),
    STORAGE_ACCESS_KEY: zod_1.z.string().optional(),
    STORAGE_SECRET_KEY: zod_1.z.string().optional(),
    AI_PROVIDER: zod_1.z.string().optional(),
    AI_API_KEY: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().url().optional(),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
const validateEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        // In production, we MUST fail if critical variables are missing.
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        else {
            // In development, we can warn but proceed (or exit depending on strictness).
            // Here we exit because we need at least JWT_SECRET.
            process.exit(1);
        }
    }
    return parsed.data;
};
exports.validateEnv = validateEnv;
// Export the validated and typed environment variables
exports.env = (0, exports.validateEnv)();
