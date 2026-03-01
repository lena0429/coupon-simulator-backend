# Coupon Simulator Backend

A production-grade Express + TypeScript backend implementing secure coupon simulation with structured logging, type-safe authentication, and the role-based access control.

## Key Features

- ✅ **Request ID Propagation** – UUID tracking across requests, logs, and error responses
- ✅ **Structured Logging** – Pino-based JSON logging with automatic sensitive header redaction
- ✅ **API Key Authentication** – Secure authentication with environment-based key management
- ✅ **Type-Safe RBAC** – Compile-time role and permission validation (admin/viewer)
- ✅ **Environment Validation** – Fail-fast startup checks for missing required configuration
- ✅ **Centralized Error Handling** – Standardized error codes (`AUTH_UNAUTHORIZED`, `AUTH_FORBIDDEN`)
- ✅ **Automated Tests** – 42 passing tests with comprehensive auth/RBAC coverage

## Architecture

### Middleware Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│  Request                                                             │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────┐
   │  requestContext     │  Attach requestId, set x-request-id header
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │  requestLogger      │  Log HTTP method, path, statusCode, responseTimeMs
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │  authenticate       │  Validate x-api-key header, attach req.user
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │  requireRoles()     │  Check user role against allowed roles (403 if denied)
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │  Route Handlers     │  Business logic (pricing calculation, etc.)
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │  errorHandler       │  Log errors with requestId, return standardized JSON
   └─────────┬───────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────┐
│  Response (includes x-request-id header)                            │
└────────────────────────────────────────────────────────────────────┘
```

**Layer Responsibilities**:
- **requestContext** – Generates/accepts UUID for request tracking
- **requestLogger** – Emits structured logs for observability
- **authenticate** – Validates API key, assigns role to `req.user`
- **requireRoles** – Enforces role-based access control (RBAC)
- **Route Handlers** – Execute domain logic
- **errorHandler** – Catches errors, logs with context, returns standardized JSON

## Quickstart

### Prerequisites
- Node.js v18+ recommended
- npm or yarn

### Installation

```bash
# Clone and install
git clone https://github.com/lena0429/coupon-simulator-backend.git
cd coupon-simulator-backend
npm install

# Configure environment
cp .env.example .env
```

### Required Environment Variables

Edit `.env` and set:

```bash
API_KEY=your-secret-admin-key-here       # Required (server fails without it)
API_KEY_READONLY=your-viewer-key-here    # Optional (for read-only access)
PORT=3000                                 # Optional (default: 3000)
LOG_LEVEL=info                            # Optional (default: info)
NODE_ENV=development                      # Optional (default: development)
```

### Run Locally

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

## API Examples

### 1. Success (200) – Valid Admin API Key

```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-admin-key-here" \
  -d '{
    "items": [
      { "id": "item-1", "name": "Widget", "price": 10.0, "qty": 2 }
    ],
    "couponCode": "SAVE10"
  }'
```

**Response** (200):
```json
{
  "subtotal": 20.0,
  "discount": 2.0,
  "total": 18.0
}
```

### 2. Unauthorized (401) – Missing API Key

```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"1","name":"Test","price":10,"qty":1}]}'
```

**Response** (401):
```json
{
  "code": "AUTH_UNAUTHORIZED",
  "error": "Unauthorized",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### 3. Forbidden (403) – Valid Key, Insufficient Role

```bash
# Using viewer key (API_KEY_READONLY) for an admin-only endpoint
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-viewer-key-here" \
  -d '{"items":[{"id":"1","name":"Test","price":10,"qty":1}]}'
```

**Response** (403):
```json
{
  "code": "AUTH_FORBIDDEN",
  "error": "Forbidden",
  "requestId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

### 4. Public Health Check (No Auth Required)

```bash
curl http://localhost:3000/health
```

**Response** (200):
```json
{
  "status": "ok"
}
```

**Note**: All responses include the `x-request-id` header for request tracing.

## Error Response Format

All errors follow a consistent JSON structure:

```typescript
{
  "code": string,        // Machine-readable error code (e.g., "AUTH_UNAUTHORIZED")
  "error": string,       // Human-readable error message
  "requestId": string,   // UUID for debugging/log correlation
  "details"?: unknown    // Optional: additional context (e.g., validation errors)
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_UNAUTHORIZED` | 401 | Missing or invalid API key |
| `AUTH_FORBIDDEN` | 403 | Valid credentials but insufficient permissions |
| N/A | 400 | Validation errors (includes details from Zod) |
| N/A | 500 | Internal server error (details hidden in production) |

**Debugging Tip**: Use the `requestId` to search logs for the full error context, including stack traces (in development).

## Project Structure

```
coupon-simulator-backend/
├── src/
│   ├── server.ts                       # Entry point, env validation
│   ├── app.ts                          # Express app config, middleware chain
│   ├── utils/
│   │   └── logger.ts                   # Pino logger setup
│   ├── middleware/
│   │   ├── requestContext.ts           # Request ID tracking + Express type augmentation
│   │   ├── requestLogger.ts            # HTTP request/response logging
│   │   ├── auth.ts                     # API key authentication
│   │   ├── rbac.ts                     # Role-based access control (type-safe)
│   │   ├── errorHandler.ts             # Global error handler
│   │   ├── notFound.ts                 # 404 handler
│   │   └── asyncHandler.ts             # Async route wrapper
│   ├── routes/
│   │   ├── health.ts                   # Health check endpoint
│   │   ├── pricing.ts                  # Pricing simulation endpoints
│   │   └── schemas/
│   │       └── pricing.schema.ts       # Zod request validation schemas
│   ├── engine/
│   │   └── pricing/                    # Domain logic: pricing calculation engine
│   │       ├── index.ts                # Main pricing simulator
│   │       ├── money.ts                # Money type utilities
│   │       └── rules/                  # Coupon rules (percentOff, etc.)
│   └── errors/
│       └── AppError.ts                 # Custom error class
├── .env.example                        # Environment variable template
├── package.json
├── tsconfig.json
└── vitest.config.ts                    # Test configuration
```

## Testing

Run the full test suite:

```bash
npm test
```

**Current Coverage**: 42 tests passing
- Unit tests for pricing engine and money utilities
- Integration tests for authentication and RBAC
- Error handler tests for standardized responses

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (strict mode)
- **Framework**: Express
- **Logging**: Pino (structured JSON)
- **Validation**: Zod (type-safe schema validation)
- **Testing**: Vitest + Supertest
- **Environment**: dotenv

## Security Considerations

- ✅ API keys loaded from environment variables (never hardcoded)
- ✅ Sensitive headers (Authorization, x-api-key) automatically redacted from logs
- ✅ Fail-fast validation prevents server startup with missing credentials
- ✅ Type-safe RBAC prevents role/permission typos at compile time
- ✅ Request ID tracking enables audit trails and debugging

**Production Recommendations**:
- Use strong, randomly generated API keys (32+ characters)
- Store secrets in a secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate API keys regularly
- Deploy behind HTTPS (nginx, ALB, etc.)
- Consider adding rate limiting for public-facing deployments

## Release Process

This project uses [Release Please](https://github.com/googleapis/release-please) with
[Conventional Commits](https://www.conventionalcommits.org/) for fully automated releases.

### How it works

1. **Write commits using Conventional Commits prefixes** in every PR:
   | Prefix | Effect |
   |---|---|
   | `feat: …` | bumps **minor** version (0.x.0) |
   | `fix: …` | bumps **patch** version (0.0.x) |
   | `feat!: …` / `BREAKING CHANGE:` | bumps **major** version (x.0.0) |
   | `chore:`, `docs:`, `refactor:`, `test:` | no version bump |

2. **Merge your PR into `main`.**
   The Release Please GitHub Actions workflow (`.github/workflows/release-please.yml`)
   runs automatically and creates or updates a **Release PR** titled
   `chore(release): <next-version>`.

3. **Review and merge the Release PR** when you are ready to publish.
   On merge, Release Please automatically:
   - Bumps the version in `package.json`
   - Prepends a new section to `CHANGELOG.md`
   - Creates a `vX.Y.Z` git tag
   - Publishes a GitHub Release with the changelog notes

> **Note:** The workflow uses `GITHUB_TOKEN`, which is sufficient for creating
> Release PRs and GitHub Releases. If your branch protection requires a specific
> code-owner approval, approve the Release PR like any other PR before merging.

## Roadmap

- [x] **CI/CD Pipeline** – GitHub Actions workflow for automated testing and deployment
- [ ] **Advanced Coupon Rules** – Support for BOGO, tiered discounts, minimum purchase amounts
- [x] **Automated Releases** – Semantic versioning with changelog generation via Release Please
- [ ] **API Documentation** – OpenAPI/Swagger spec for interactive endpoint testing
- [ ] **Performance Monitoring** – Prometheus metrics and distributed tracing

## License

ISC

---

**Built with TypeScript, Express, and production-grade observability practices.**
