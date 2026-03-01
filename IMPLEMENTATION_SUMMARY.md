# Implementation Summary: Logging, Authentication & RBAC

## Overview
Successfully implemented production-grade request logging, API key authentication, and role-based access control (RBAC) for the Express + TypeScript backend.

## Features Implemented

### ✅ Logging (Pino)
- Structured JSON logging with pino
- Request/response logging with metrics (method, path, statusCode, responseTimeMs)
- Automatic request ID generation and tracking
- Sensitive header redaction (Authorization, x-api-key)
- Pretty-print in development, JSON in production
- Error logging with stack traces (dev only)

### ✅ Authentication (API Key)
- API key authentication via `x-api-key` header
- Case-insensitive header lookup
- Lazy configuration loading (test-friendly)
- Secure: prevents empty string keys in config
- Fail-fast startup validation for required env vars

### ✅ Role-Based Access Control (RBAC)
- Type-safe Role system (`admin` | `viewer`)
- Type-safe Permission system derived from role mappings
- `requireRoles()` middleware for route-level protection
- `requirePermission()` middleware for granular access control
- Proper 401 (Unauthorized) and 403 (Forbidden) responses with machine-readable codes

### ✅ Request Context
- UUID generation for request tracking
- Accepts incoming `x-request-id` header or generates new
- Returns `x-request-id` in all responses (including errors)

### ✅ Testing
- Comprehensive integration tests (42 tests, all passing)
- Auth/RBAC coverage: 401, 403, 200 scenarios
- Request ID propagation tests
- Error handling tests

## Files Changed/Created

### New Files
```
src/utils/logger.ts                    # Pino logger configuration
src/middleware/requestContext.ts       # Request ID tracking & type augmentation
src/middleware/requestLogger.ts        # HTTP request/response logging
src/middleware/auth.ts                 # API key authentication
src/middleware/rbac.ts                 # Role-based access control
src/routes/__tests__/auth.test.ts      # Integration tests for auth/RBAC
.env.example                           # Environment variable template
```

### Modified Files
```
package.json                           # Added pino, pino-http, pino-pretty, supertest
src/app.ts                             # Wired middleware chain
src/server.ts                          # Added env validation (fail-fast)
src/routes/pricing.ts                  # Added auth + RBAC protection
src/middleware/errorHandler.ts         # Updated to use pino logger + requestId
src/middleware/__tests__/errorHandler.test.ts  # Updated for requestId
README.md                              # Comprehensive documentation with examples
```

## Middleware Chain Order

```
1. requestContext      → Attach requestId to req/res
2. requestLogger       → Log HTTP requests/responses
3. express.json()      → Parse JSON bodies
4. Routes              → Application routes (some protected)
   ├─ /health          → Public (no auth)
   └─ /pricing/*       → Protected (auth + RBAC)
5. notFoundHandler     → 404 handler
6. errorHandler        → Global error handler
```

## Route Protection

| Route | Authentication | Authorization | Description |
|-------|----------------|---------------|-------------|
| `GET /health` | ❌ None | ❌ None | Public health check |
| `POST /pricing/simulate` | ✅ Required | ✅ `admin` role | Pricing simulation (demonstrates 403) |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `API_KEY` | **Yes** | - | Admin API key (server fails without it) |
| `API_KEY_READONLY` | No | - | Viewer API key (optional) |
| `LOG_LEVEL` | No | info | Logging level |
| `NODE_ENV` | No | development | Environment |

## Type Safety Highlights

- **Strongly typed roles**: `req.user.role` is typed as `Role` (`admin` | `viewer`), not `string`
- **Derived Permission type**: Permissions are extracted from `ROLE_PERMISSIONS` at compile time
- **No unsafe casts**: All type assertions are safe and justified
- **Express Request augmentation**: `requestId` and `user` are properly typed

## Testing

Run all tests:
```bash
npm test
```

Run specific test suite:
```bash
npm test -- src/routes/__tests__/auth.test.ts
```

**Test Results**: 42/42 passing ✅

## Example cURL Commands

### 1. Health Check (Public - No Auth)
```bash
curl http://localhost:3000/health
# Expected: 200 OK
# Response: { "status": "ok" }
```

### 2. Protected Endpoint - No API Key (401 Unauthorized)
```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "id": "1", "name": "Widget", "price": 10.0, "qty": 2 }
    ],
    "couponCode": "SAVE10"
  }'

# Expected: 401 Unauthorized
# Response:
# {
#   "code": "AUTH_UNAUTHORIZED",
#   "error": "Unauthorized",
#   "requestId": "..."
# }
```

### 3. Protected Endpoint - Invalid API Key (401 Unauthorized)
```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{
    "items": [
      { "id": "1", "name": "Widget", "price": 10.0, "qty": 2 }
    ]
  }'

# Expected: 401 Unauthorized
```

### 4. Protected Endpoint - Viewer Role (403 Forbidden)
```bash
# Set up viewer key in .env: API_KEY_READONLY=viewer-key-123

curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: viewer-key-123" \
  -d '{
    "items": [
      { "id": "1", "name": "Widget", "price": 10.0, "qty": 2 }
    ],
    "couponCode": "SAVE10"
  }'

# Expected: 403 Forbidden
# Response:
# {
#   "code": "AUTH_FORBIDDEN",
#   "error": "Forbidden",
#   "requestId": "..."
# }
```

### 5. Protected Endpoint - Admin Role (200 Success)
```bash
# Set up admin key in .env: API_KEY=admin-key-123

curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: admin-key-123" \
  -d '{
    "items": [
      { "id": "1", "name": "Widget", "price": 10.0, "qty": 2 }
    ],
    "couponCode": "SAVE10"
  }'

# Expected: 200 OK
# Response: <pricing calculation result>
```

### 6. With Custom Request ID
```bash
curl http://localhost:3000/health \
  -H "x-request-id: my-custom-id-123" \
  -v

# Check response headers for:
# x-request-id: my-custom-id-123
```

## Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and set API_KEY=your-secret-key
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Verify with health check**:
   ```bash
   curl http://localhost:3000/health
   ```

5. **Test authentication**:
   ```bash
   # Replace YOUR_API_KEY with the value from your .env file
   curl -X POST http://localhost:3000/pricing/simulate \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_API_KEY" \
     -d '{"items":[{"id":"1","name":"Test","price":10,"qty":1}]}'
   ```

## Production Deployment

1. **Build**:
   ```bash
   npm run build
   ```

2. **Set environment variables** (example for Docker/K8s):
   ```bash
   export API_KEY=<strong-random-key>
   export NODE_ENV=production
   export PORT=3000
   export LOG_LEVEL=info
   ```

3. **Start**:
   ```bash
   npm start
   ```

4. **Verify startup**:
   - Server should fail with clear error if `API_KEY` is missing
   - Logs should be in JSON format (not pretty-printed)

## Security Considerations

✅ **Implemented**:
- API keys validated before processing requests
- Sensitive headers automatically redacted from logs
- Empty string keys prevented in auth config
- Request ID tracking for audit trails
- Type-safe role/permission system prevents typos
- Fail-fast on missing required env vars

⚠️ **Production Recommendations**:
- Use strong, randomly generated API keys (32+ characters)
- Rotate API keys regularly
- Store API keys in secure secret management (AWS Secrets Manager, Vault, etc.)
- Consider adding rate limiting for API endpoints
- Consider JWT with expiration for longer-term deployments
- Add HTTPS in production (use reverse proxy like nginx)
- Consider adding CORS if accessed from browser

## GitHub Actions Integration

Add to repository secrets:
- `API_KEY`: Production admin API key

Example workflow step:
```yaml
- name: Run tests
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: npm test

- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
    NODE_ENV: production
  run: |
    npm run build
    npm start
```

## Troubleshooting

### Server fails to start
- **Error**: "Missing required environment variables: API_KEY"
- **Solution**: Create `.env` file with `API_KEY=your-key-here`

### 401 Unauthorized despite valid key
- Check that `x-api-key` header is set correctly
- Verify the key matches the value in `.env`
- Check for leading/trailing whitespace in env var

### 403 Forbidden
- User is authenticated but lacks required role
- Check role assigned to API key in `src/middleware/auth.ts`
- Verify route requires the role you have (e.g., `/pricing/simulate` requires `admin`)

### Logs not appearing
- Check `LOG_LEVEL` environment variable
- Ensure you're looking at stderr (pino outputs to stderr by default)

## Next Steps / Future Enhancements

- [ ] Add JWT authentication for user-based auth (vs API keys)
- [ ] Implement token refresh mechanism
- [ ] Add rate limiting (e.g., express-rate-limit)
- [ ] Add request/response body logging (with size limits)
- [ ] Implement permission-based access beyond roles
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add metrics collection (Prometheus)
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Add session management for web clients
- [ ] Implement audit logging to database

## References

- [Pino Documentation](https://getpino.io/)
- [Express TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/react-&-webpack.html)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
