import express, { Application } from 'express';
import healthRouter from './routes/health';

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use('/health', healthRouter);

export default app;
