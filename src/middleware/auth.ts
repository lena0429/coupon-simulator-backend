import { Request, Response, NextFunction } from 'express';
import { Role } from './rbac';

/**
 * Builds API key configuration from environment variables
 * Only includes keys that are actually defined to prevent empty string keys
 * Cached after first call for performance
 */
let cachedConfig: Record<string, { role: Role }> | null = null;

function getApiKeyConfig(): Record<string, { role: Role }> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config: Record<string, { role: Role }> = {};

  // Only add admin key if environment variable is set and non-empty
  // Prevents security issue where empty env var creates '' key
  if (process.env.API_KEY) {
    config[process.env.API_KEY] = { role: 'admin' };
  }

  // Optional read-only key for testing/demo purposes
  if (process.env.API_KEY_READONLY) {
    config[process.env.API_KEY_READONLY] = { role: 'viewer' };
  }

  cachedConfig = config;
  return config;
}

/**
 * Helper to send 401 Unauthorized response
 */
function sendUnauthorized(res: Response, requestId: string): void {
  res.status(401).json({
    code: 'AUTH_UNAUTHORIZED',
    error: 'Unauthorized',
    requestId,
  });
}

/**
 * Authentication middleware using API key
 * Supports x-api-key header
 * Returns 401 for missing or invalid credentials
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use req.get() for safer, case-insensitive header access
  const apiKey = req.get('x-api-key');

  // Check if API key is provided
  if (!apiKey) {
    sendUnauthorized(res, req.requestId);
    return;
  }

  // Validate API key and get user role
  const apiKeyConfig = getApiKeyConfig();
  const userConfig = apiKeyConfig[apiKey];

  if (!userConfig) {
    sendUnauthorized(res, req.requestId);
    return;
  }

  // Attach user to request for downstream middleware/handlers
  req.user = {
    role: userConfig.role,
  };

  next();
}
