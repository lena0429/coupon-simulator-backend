import { Request, Response } from 'express';

/**
 * 404 handler for unmatched routes
 * Should be registered after all valid routes but before error handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}
