# Coupon Simulator Backend

A production-grade Express + TypeScript backend with structured logging, authentication, and role-based access control (RBAC).

## Features

- ✅ **Structured JSON logging** with pino
- ✅ **Request ID tracking** (x-request-id header)
- ✅ **API key authentication** with role-based access control
- ✅ **Type-safe RBAC** with compile-time guarantees
- ✅ **Global error handling** with proper logging
- ✅ **Environment validation** (fail-fast on startup)

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```bash
# Required
API_KEY=your-secret-admin-key-here

# Optional
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
```

**Important**: The `API_KEY` environment variable is **required**. The server will fail to start without it.

## Running the Application

### Development Mode
```bash
npm run dev
```
This runs the server with `tsx` for instant TypeScript execution with hot reload.

### Production Mode
1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## API Endpoints

### Health Check (Public)
- **Endpoint**: `GET /health`
- **Authentication**: None required
- **Response**: `{ "status": "ok" }`
- **Status Code**: 200

This endpoint can be used for deployment validation and CI/CD health checks.

**Example:**
```bash
curl http://localhost:3000/health
```

### Pricing Simulation (Protected)
- **Endpoint**: `POST /pricing/simulate`
- **Authentication**: Required (admin role)
- **Headers**: `x-api-key: <your-admin-key>`
- **Request Body**:
```json
{
  "items": [
    { "name": "Item 1", "priceInCents": 1000, "quantity": 2 }
  ],
  "couponCode": "SAVE10"
}
```
- **Response**: Pricing calculation result
- **Status Codes**:
  - 200: Success
  - 401: Unauthorized (missing or invalid API key)
  - 403: Forbidden (authenticated but insufficient role)

**Example (Success with admin key):**
```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-admin-key-here" \
  -d '{
    "items": [
      { "name": "Widget", "priceInCents": 1000, "quantity": 2 }
    ],
    "couponCode": "SAVE10"
  }'
```

**Example (401 - No authentication):**
```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "name": "Widget", "priceInCents": 1000, "quantity": 2 }
    ]
  }'

# Response:
# {
#   "code": "AUTH_UNAUTHORIZED",
#   "error": "Unauthorized",
#   "requestId": "..."
# }
```

**Example (403 - Authenticated but wrong role):**
```bash
# Using a viewer key (read-only) to access an admin-only endpoint
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-readonly-key-here" \
  -d '{
    "items": [
      { "name": "Widget", "priceInCents": 1000, "quantity": 2 }
    ]
  }'

# Response:
# {
#   "code": "AUTH_FORBIDDEN",
#   "error": "Forbidden",
#   "requestId": "..."
# }
```

## Authentication & Authorization

### API Key Authentication

This backend uses API key authentication via the `x-api-key` header. Keys are configured through environment variables:

- `API_KEY`: Admin key (full access)
- `API_KEY_READONLY`: Viewer key (read-only access) - optional

### Roles

- **admin**: Full access to all endpoints
- **viewer**: Read-only access (limited endpoints)

### Request ID Tracking

All requests are assigned a unique request ID (UUID) which:
- Can be provided via `x-request-id` header
- Is auto-generated if not provided
- Is returned in the `x-request-id` response header
- Is included in all error responses for debugging

## Logging

The application uses [pino](https://getpino.io/) for structured JSON logging:

- **Development**: Pretty-printed, colorized logs
- **Production**: Structured JSON for log aggregation
- **Sensitive data**: Authorization headers and API keys are automatically redacted

All logs include:
- `requestId`: Unique request identifier
- `method`: HTTP method
- `path`: Request path
- `statusCode`: Response status
- `responseTimeMs`: Request duration

## Project Structure

```
coupon-simulator-backend/
├── src/
│   ├── server.ts                    # Entry point with env validation
│   ├── app.ts                       # Express app configuration
│   ├── utils/
│   │   └── logger.ts                # Pino logger configuration
│   ├── middleware/
│   │   ├── requestContext.ts        # Request ID tracking
│   │   ├── requestLogger.ts         # HTTP request logging
│   │   ├── auth.ts                  # API key authentication
│   │   ├── rbac.ts                  # Role-based access control
│   │   ├── errorHandler.ts          # Global error handler
│   │   ├── notFound.ts              # 404 handler
│   │   └── asyncHandler.ts          # Async route wrapper
│   ├── routes/
│   │   ├── health.ts                # Health check endpoint
│   │   └── pricing.ts               # Pricing endpoints
│   ├── engine/
│   │   └── pricing/                 # Pricing calculation engine
│   └── errors/
│       └── AppError.ts              # Custom error class
├── dist/                            # Compiled JavaScript (generated)
├── .env.example                     # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## CI/CD & GitHub Actions

To use this backend in GitHub Actions workflows, add the following secrets to your repository:

- `API_KEY`: Production admin API key

**Note**: When deploying, ensure all required environment variables are configured in your deployment environment.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `API_KEY` | **Yes** | - | Admin API key for authentication |
| `API_KEY_READONLY` | No | - | Read-only viewer API key (optional) |
| `LOG_LEVEL` | No | info | Logging level (trace, debug, info, warn, error, fatal) |
| `NODE_ENV` | No | development | Environment (development, production) |
