export interface AppErrorOptions {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.statusCode = options.statusCode ?? 400;
    this.code = options.code;
    this.details = options.details;
    this.name = 'AppError';

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}
