import express, { Application } from 'express';
import healthRouter from './routes/health';
import pricingRouter from './routes/pricing';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/pricing', pricingRouter);

// Error handling (must be registered after routes)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
