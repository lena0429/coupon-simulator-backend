// Set up test environment variables BEFORE importing app
process.env.API_KEY = 'test-admin-key';
process.env.API_KEY_READONLY = 'test-viewer-key';

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Authentication & Authorization', () => {
  describe('GET /health', () => {
    it('should return 200 without authentication', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should generate request ID if not provided', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should use provided request ID', async () => {
      const requestId = 'test-request-id-123';
      const response = await request(app)
        .get('/health')
        .set('x-request-id', requestId);

      expect(response.headers['x-request-id']).toBe(requestId);
    });
  });

  describe('POST /pricing/simulate', () => {
    const validPayload = {
      items: [
        {
          id: 'item-1',
          name: 'Test Item',
          price: 10.0,
          qty: 2,
        },
      ],
      couponCode: 'SAVE10',
    };

    it('should return 401 without API key', async () => {
      const response = await request(app)
        .post('/pricing/simulate')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        code: 'AUTH_UNAUTHORIZED',
        error: 'Unauthorized',
      });
      expect(response.body.requestId).toBeDefined();
    });

    it('should return 401 with invalid API key', async () => {
      const response = await request(app)
        .post('/pricing/simulate')
        .set('x-api-key', 'invalid-key')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        code: 'AUTH_UNAUTHORIZED',
        error: 'Unauthorized',
      });
      expect(response.body.requestId).toBeDefined();
    });

    it('should return 403 with viewer role (insufficient permissions)', async () => {
      const response = await request(app)
        .post('/pricing/simulate')
        .set('x-api-key', 'test-viewer-key')
        .send(validPayload);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'AUTH_FORBIDDEN',
        error: 'Forbidden',
      });
      expect(response.body.requestId).toBeDefined();
    });

    it('should return 200 with valid admin API key', async () => {
      const response = await request(app)
        .post('/pricing/simulate')
        .set('x-api-key', 'test-admin-key')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should handle case-insensitive header lookup', async () => {
      const response = await request(app)
        .post('/pricing/simulate')
        .set('X-API-KEY', 'test-admin-key') // uppercase header
        .send(validPayload);

      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid request body with auth', async () => {
      const response = await request(app)
        .post('/pricing/simulate')
        .set('x-api-key', 'test-admin-key')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
      expect(response.body.requestId).toBeDefined();
    });
  });

  describe('Request ID propagation', () => {
    it('should include requestId in all error responses', async () => {
      // 401 error
      const unauthorizedResponse = await request(app)
        .post('/pricing/simulate')
        .send({});

      expect(unauthorizedResponse.body.requestId).toBeDefined();

      // 403 error
      const forbiddenResponse = await request(app)
        .post('/pricing/simulate')
        .set('x-api-key', 'test-viewer-key')
        .send({});

      expect(forbiddenResponse.body.requestId).toBeDefined();

      // 400 error (validation)
      const validationResponse = await request(app)
        .post('/pricing/simulate')
        .set('x-api-key', 'test-admin-key')
        .send({ invalid: 'data' });

      expect(validationResponse.body.requestId).toBeDefined();
    });
  });
});
