import { Request, Response, NextFunction } from 'express';

export type Role = 'admin' | 'viewer';

const ROLE_PERMISSIONS = {
  admin: ['pricing:read', 'pricing:write', 'pricing:simulate'],
  viewer: ['pricing:read'],
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[Role][number];

function sendUnauthorized(res: Response, requestId: string): void {
  res.status(401).json({
    code: 'AUTH_UNAUTHORIZED',
    error: 'Unauthorized',
    requestId,
  });
}

function sendForbidden(res: Response, requestId: string): void {
  res.status(403).json({
    code: 'AUTH_FORBIDDEN',
    error: 'Forbidden',
    requestId,
  });
}

export function requireRoles(allowedRoles: readonly Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, req.requestId);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendForbidden(res, req.requestId);
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, req.requestId);
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] as readonly Permission[];

    if (!userPermissions.includes(permission)) {
      sendForbidden(res, req.requestId);
      return;
    }

    next();
  };
}
