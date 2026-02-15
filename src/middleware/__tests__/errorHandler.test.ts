import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler } from '../errorHandler';
import { AppError } from '../../errors/AppError';

describe('errorHandler', () => {
  describe('ZodError handling', () => {
    it('should return 400 with treeifyError format for ZodError', () => {
      const schema = z.object({ name: z.string() });
      let zodError: ZodError;

      try {
        schema.parse({ name: 123 });
      } catch (err) {
        zodError = err as ZodError;
      }

      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      errorHandler(zodError!, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        details: expect.any(Object),
      });
    });
  });

  describe('AppError handling', () => {
    it('should handle AppError with status code and message', () => {
      const err = new AppError('Validation failed', { statusCode: 400 });
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
      });
    });

    it('should default to 400 when statusCode not provided', () => {
      const err = new AppError('Bad request');
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
      });
    });

    it('should include code when provided', () => {
      const err = new AppError('Business rule failed', {
        statusCode: 422,
        code: 'INSUFFICIENT_FUNDS',
      });
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Business rule failed',
        code: 'INSUFFICIENT_FUNDS',
      });
    });

    it('should include details when provided', () => {
      const err = new AppError('Invalid input', {
        statusCode: 400,
        details: { field: 'email', reason: 'Invalid format' },
      });
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid input',
        details: { field: 'email', reason: 'Invalid format' },
      });
    });

    it('should include both code and details when provided', () => {
      const err = new AppError('Operation failed', {
        statusCode: 409,
        code: 'CONFLICT',
        details: { resource: 'user', id: '123' },
      });
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Operation failed',
        code: 'CONFLICT',
        details: { resource: 'user', id: '123' },
      });
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors with 500 status', () => {
      const err = new Error('Database connection failed');
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      // Mock console.error to avoid test output pollution
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error:', err);

      consoleErrorSpy.mockRestore();
    });

    it('should not leak error details in 500 response', () => {
      const err = new Error('Sensitive database connection string: postgres://...');
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler(err, req, res, next);

      const jsonCall = (res.json as any).mock.calls[0][0];
      expect(jsonCall.error).toBe('Internal server error');
      expect(jsonCall.details).toBeUndefined();
      expect(JSON.stringify(jsonCall)).not.toContain('postgres://');

      consoleErrorSpy.mockRestore();
    });
  });
});
