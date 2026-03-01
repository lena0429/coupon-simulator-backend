import pino from 'pino';

/**
 * Production-grade logger using pino for structured JSON logging
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  // Base fields to include in all logs
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive fields from logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-api-key"]'],
    remove: true,
  },
});
