import { Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { RequestWithId } from './requestId.middleware';
import { env } from '../config/env.config';

export const errorHandler = (err: any, req: RequestWithId, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'Internal Server Error';
  
  // Create safe error context without sensitive tokens
  const errorContext = {
    route: req.originalUrl,
    method: req.method,
    errorType: err.name,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  };

  logger.error(message, {
    requestId: req.id,
    userId: (req as any).user?.id,
    ...errorContext
  });
  
  // In production, mask generic errors
  const safeMessage = (env.NODE_ENV === 'production' && statusCode >= 500) 
    ? 'An unexpected error occurred.' 
    : message;

  sendError(res, safeMessage, err.name || 'SERVER_ERROR', statusCode, req.id);
};
