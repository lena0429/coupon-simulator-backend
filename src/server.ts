import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';

/**
 * Validates required environment variables
 * Fails fast with clear error message if any are missing
 */
function validateEnv(): void {
  const required = ['API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error({
      message: 'Missing required environment variables',
      missing,
    });
    console.error(`ERROR: Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your .env file or environment configuration.');
    process.exit(1);
  }
}

// Validate environment before starting server
validateEnv();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
