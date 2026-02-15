import express, { Application } from 'express';
import healthRouter from './routes/health';
import pricingRouter from './routes/pricing';

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/pricing', pricingRouter);

export default app;
