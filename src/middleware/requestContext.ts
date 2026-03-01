import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { Role } from './rbac';

/**
 * Extends Express Request to include requestId and user
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        role: Role;
      };
    }
  }
}

/**
 * Request context middleware
 * - Accepts incoming "x-request-id" if provided, otherwise generates a UUID
 * - Attaches requestId to req.requestId
 * - Sets response header "x-request-id"
 */
export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID or generate a new one
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Attach to request object
  req.requestId = requestId;

  // Set response header
  res.setHeader('x-request-id', requestId);

  next();
}
