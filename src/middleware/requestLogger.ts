import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';

/**
 * Request logging middleware using pino-http
 * Logs on request completion with:
 * - method, path, statusCode, responseTimeMs, requestId
 * - Sensitive headers are redacted (Authorization, x-api-key)
 */
export const requestLogger = pinoHttp({
  logger,
  // Use the requestId from the request context
  genReqId: (req: Request) => req.requestId,
  // Custom serializers to control what gets logged
  serializers: {
    req: (req: Request) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      // Explicitly exclude sensitive headers
      headers: {
        ...req.headers,
        authorization: undefined,
        'x-api-key': undefined,
      },
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode,
    }),
  },
  // Custom log message on request completion
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  // Custom success message
  customSuccessMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.path} ${res.statusCode}`;
  },
  // Custom error message
  customErrorMessage: (req: Request, res: Response, err) => {
    return `${req.method} ${req.path} ${res.statusCode} - ${err.message}`;
  },
  // Additional attributes to include in log
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'responseTimeMs',
  },
});
