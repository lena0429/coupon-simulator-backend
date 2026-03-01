import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 * Must be registered as the last middleware in app.ts
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.requestId;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn({
      requestId,
      statusCode: 400,
      error: 'Zod validation error',
      details: z.treeifyError(err),
    });

    res.status(400).json({
      error: 'Invalid request',
      details: z.treeifyError(err),
      requestId,
    });
    return;
  }

  // Handle application errors with known status codes
  if (err instanceof AppError) {
    const response: { error: string; code?: string; details?: unknown; requestId: string } = {
      error: err.message,
      requestId,
    };

    if (err.code !== undefined) {
      response.code = err.code;
    }

    if (err.details !== undefined) {
      response.details = err.details;
    }

    logger.error({
      requestId,
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });

    res.status(err.statusCode).json(response);
    return;
  }

  // Unknown errors: Log with stack trace and return 500
  logger.error({
    requestId,
    statusCode: 500,
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: process.env.NODE_ENV !== 'production' && err instanceof Error ? err.stack : undefined,
    error: err,
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId,
  });
}
