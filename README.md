# Coupon Simulator Backend

A minimal Express + TypeScript backend for the coupon simulator application.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

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

### Health Check
- **Endpoint**: `GET /health`
- **Response**: `{ "status": "ok" }`
- **Status Code**: 200

This endpoint can be used for deployment validation and CI/CD health checks.

## Project Structure

```
coupon-simulator-backend/
├── src/
│   ├── server.ts       # Entry point
│   ├── app.ts          # Express app configuration
│   └── routes/
│       └── health.ts   # Health check endpoint
├── dist/               # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

- `PORT`: Server port (default: 3000)
