import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from '../errors/AppError';

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
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request',
      details: z.treeifyError(err),
    });
    return;
  }

  // Handle application errors with known status codes
  if (err instanceof AppError) {
    const response: { error: string; code?: string; details?: unknown } = {
      error: err.message,
    };

    if (err.code !== undefined) {
      response.code = err.code;
    }

    if (err.details !== undefined) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Unknown errors: Log and return 500
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
}
