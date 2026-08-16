import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables before parsing
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().url().default('mongodb://127.0.0.1:27017/parental_control'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  SOCKET_SECRET: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  AI_PROVIDER: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    
    // In production, we MUST fail if critical variables are missing.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // In development, we can warn but proceed (or exit depending on strictness).
      // Here we exit because we need at least JWT_SECRET.
      process.exit(1);
    }
  }

  return parsed.data;
};

// Export the validated and typed environment variables
export const env = validateEnv();
