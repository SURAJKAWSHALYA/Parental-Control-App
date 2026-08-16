"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const setupIndexes_1 = require("../config/setupIndexes");
const logger_1 = require("../utils/logger");
const runMigrations = async () => {
    logger_1.logger.info('Starting database migrations...');
    try {
        // 001_initial: We assume the current schema state is the initial migration.
        // Nothing structural to run for initial setup besides creating collections (Mongoose does this).
        // 002_indexes: Run our index setup script
        logger_1.logger.info('Running migration: 002_indexes');
        await (0, setupIndexes_1.setupIndexes)();
        logger_1.logger.info('Database migrations completed successfully.');
    }
    catch (error) {
        logger_1.logger.error('Database migration failed', { error: error.message });
        throw error;
    }
};
exports.runMigrations = runMigrations;
