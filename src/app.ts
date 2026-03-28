import express, { Application } from 'express';
import healthRouter from './routes/health';
import pricingRouter from './routes/pricing';
import agentRouter from './routes/agent';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
import { requestLogger } from './middleware/requestLogger';

const app: Application = express();

// Request context and logging (before all other middleware)
app.use(requestContext);
app.use(requestLogger);

// Body parsing
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/pricing', pricingRouter);
app.use('/agent', agentRouter);

// Error handling (must be registered after routes)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
