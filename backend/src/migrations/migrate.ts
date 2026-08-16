import { setupIndexes } from '../config/setupIndexes';
import { logger } from '../utils/logger';

export const runMigrations = async () => {
  logger.info('Starting database migrations...');
  try {
    // 001_initial: We assume the current schema state is the initial migration.
    // Nothing structural to run for initial setup besides creating collections (Mongoose does this).

    // 002_indexes: Run our index setup script
    logger.info('Running migration: 002_indexes');
    await setupIndexes();

    logger.info('Database migrations completed successfully.');
  } catch (error: any) {
    logger.error('Database migration failed', { error: error.message });
    throw error;
  }
};
