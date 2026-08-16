import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'OK' : 'DEGRADED';
    
    const aiStatus = env.AI_API_KEY ? 'OK' : 'DEGRADED';

    const healthData = {
      api: 'OK',
      database: dbStatus,
      socketIO: 'OK', 
      storage: env.STORAGE_ENDPOINT ? 'OK' : 'DEGRADED',
      queue: 'OK', 
      aiService: aiStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime()
    };

    const isSystemHealthy = dbStatus === 'OK';
    const statusCode = isSystemHealthy ? 200 : 503;

    res.status(statusCode).json({
      success: isSystemHealthy,
      data: healthData
    });
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to perform health check'
    });
  }
};
