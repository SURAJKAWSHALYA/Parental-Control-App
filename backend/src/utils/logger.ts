import winston from 'winston';
import { env } from '../config/env.config';

const { combine, timestamp, printf, colorize } = winston.format;

type LogLevel = 'info' | 'warn' | 'error' | 'security' | 'audit';

// Add custom levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    security: 2,
    audit: 3,
    info: 4,
    debug: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    security: 'magenta',
    audit: 'cyan',
    info: 'green',
    debug: 'blue'
  }
};

winston.addColors(customLevels.colors);

// Custom log format
const customFormat = printf(({ level, message, timestamp, requestId, userId, ...metadata }) => {
  let msg = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (requestId) msg += ` [REQ:${requestId}]`;
  if (userId) msg += ` [USR:${userId}]`;
  
  msg += ` ${message}`;
  
  const sanitize = (data: any): any => {
    if (typeof data !== 'object' || data === null) return data;
    const scrubbed = { ...data };
    const sensitiveKeys = ['password', 'passwordhash', 'token', 'jwt', 'secret', 'key'];
    
    for (const key of Object.keys(scrubbed)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof scrubbed[key] === 'object') {
        scrubbed[key] = sanitize(scrubbed[key]);
      }
    }
    return scrubbed;
  };

  const safeContext = sanitize(metadata);
  if (Object.keys(safeContext).length > 0) {
    msg += ` | Context: ${JSON.stringify(safeContext)}`;
  }
  
  return msg;
});

const winstonLogger = winston.createLogger({
  levels: customLevels.levels,
  level: env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    })
  ]
});

export const logger = {
  info: (msg: string, meta?: any) => winstonLogger.log('info', msg, meta),
  warn: (msg: string, meta?: any) => winstonLogger.log('warn', msg, meta),
  error: (msg: string, meta?: any) => winstonLogger.log('error', msg, meta),
  security: (msg: string, meta?: any) => winstonLogger.log('security', msg, meta),
  audit: (msg: string, meta?: any) => winstonLogger.log('audit', msg, meta),
};
