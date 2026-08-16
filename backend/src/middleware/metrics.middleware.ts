import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { RequestWithId } from './requestId.middleware';

export const metricsMiddleware = (req: RequestWithId, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latencyMs = (diff[0] * 1e3) + (diff[1] * 1e-6);
    
    // In a real application, you would record this in Prometheus/StatsD here
    logger.info('Request processed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      latencyMs: Number(latencyMs.toFixed(2)),
      requestId: req.id,
      userId: (req as any).user?.id,
    });
  });

  next();
};
