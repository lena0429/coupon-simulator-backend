# Quick Start Guide

## Setup (< 2 minutes)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create .env file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit .env** and set your API keys:
   ```bash
   # .env
   PORT=3000
   API_KEY=your-admin-key-here
   API_KEY_READONLY=your-viewer-key-here
   LOG_LEVEL=info
   NODE_ENV=development
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   [INFO]: Server is running on port 3000
   ```

## Test with cURL

### 1. Health Check (No Auth Required) ✅

```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "ok"
}
```

**Headers**:
```
x-request-id: <uuid>
```

---

### 2. Protected Route - No API Key (401 Unauthorized) ❌

```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "item-1",
        "name": "Widget",
        "price": 10.0,
        "qty": 2
      }
    ],
    "couponCode": "SAVE10"
  }'
```

**Expected Response** (401):
```json
{
  "code": "AUTH_UNAUTHORIZED",
  "error": "Unauthorized",
  "requestId": "<uuid>"
}
```

---

### 3. Protected Route - Invalid API Key (401 Unauthorized) ❌

```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key" \
  -d '{
    "items": [
      {
        "id": "item-1",
        "name": "Widget",
        "price": 10.0,
        "qty": 2
      }
    ]
  }'
```

**Expected Response** (401):
```json
{
  "code": "AUTH_UNAUTHORIZED",
  "error": "Unauthorized",
  "requestId": "<uuid>"
}
```

---

### 4. Protected Route - Viewer Role (403 Forbidden) 🚫

**IMPORTANT**: Replace `your-viewer-key-here` with the value of `API_KEY_READONLY` from your `.env` file.

```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-viewer-key-here" \
  -d '{
    "items": [
      {
        "id": "item-1",
        "name": "Widget",
        "price": 10.0,
        "qty": 2
      }
    ],
    "couponCode": "SAVE10"
  }'
```

**Expected Response** (403):
```json
{
  "code": "AUTH_FORBIDDEN",
  "error": "Forbidden",
  "requestId": "<uuid>"
}
```

**Why 403?**: The `/pricing/simulate` endpoint requires the `admin` role, but viewer keys only have the `viewer` role.

---

### 5. Protected Route - Admin Role (200 Success) ✅

**IMPORTANT**: Replace `your-admin-key-here` with the value of `API_KEY` from your `.env` file.

```bash
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-admin-key-here" \
  -d '{
    "items": [
      {
        "id": "item-1",
        "name": "Widget",
        "price": 10.0,
        "qty": 2
      }
    ],
    "couponCode": "SAVE10"
  }'
```

**Expected Response** (200):
```json
{
  <pricing calculation result>
}
```

---

### 6. Custom Request ID

```bash
curl http://localhost:3000/health \
  -H "x-request-id: my-custom-tracking-id" \
  -v
```

**Check response headers** for:
```
x-request-id: my-custom-tracking-id
```

---

## Copy-Paste Test Commands

For convenience, here are the exact commands using example keys:

```bash
# Set your keys as environment variables for easy testing
export ADMIN_KEY="test-admin-key-123"
export VIEWER_KEY="test-viewer-key-456"

# Test 1: Health check (no auth)
curl http://localhost:3000/health

# Test 2: No API key (401)
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"1","name":"Widget","price":10,"qty":2}]}'

# Test 3: Invalid API key (401)
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{"items":[{"id":"1","name":"Widget","price":10,"qty":2}]}'

# Test 4: Viewer role, insufficient permissions (403)
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: $VIEWER_KEY" \
  -d '{"items":[{"id":"1","name":"Widget","price":10,"qty":2}],"couponCode":"SAVE10"}'

# Test 5: Admin role, success (200)
curl -X POST http://localhost:3000/pricing/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ADMIN_KEY" \
  -d '{"items":[{"id":"1","name":"Widget","price":10,"qty":2}],"couponCode":"SAVE10"}'
```

---

## Logs

Watch the server logs to see structured JSON logging:

- Request completion logs with metrics
- Request ID tracking
- Status codes and response times
- Error logs with stack traces (in development)

Example log entry:
```json
{
  "level": 30,
  "time": 1709324400000,
  "env": "development",
  "request": {
    "method": "POST",
    "url": "/pricing/simulate",
    "headers": { ... }
  },
  "response": {
    "statusCode": 200
  },
  "responseTimeMs": 15,
  "msg": "POST /pricing/simulate 200"
}
```

---

## Run Tests

```bash
npm test
```

Expected output:
```
✓ src/engine/pricing/__tests__/money.test.ts  (8 tests)
✓ src/engine/pricing/__tests__/index.test.ts  (16 tests)
✓ src/middleware/__tests__/errorHandler.test.ts  (8 tests)
✓ src/routes/__tests__/auth.test.ts  (10 tests)

Test Files  4 passed (4)
Tests  42 passed (42)
```

---

## Troubleshooting

**Problem**: Server won't start, shows "Missing required environment variables: API_KEY"

**Solution**:
1. Ensure `.env` file exists in the project root
2. Ensure `API_KEY=<some-value>` is set in `.env`
3. Restart the server

**Problem**: Getting 401 even with correct API key

**Solution**:
1. Verify no extra spaces in `.env` file around the `=` sign
2. Ensure the key in the curl command matches exactly
3. Restart the server after changing `.env`

**Problem**: Getting 403 instead of 200

**Solution**:
- You're using the viewer key (`API_KEY_READONLY`) instead of admin key (`API_KEY`)
- Use the admin key for `/pricing/simulate`
