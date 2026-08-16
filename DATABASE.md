# Database Architecture & Procedures

This document outlines the database configuration, indexes, and backup procedures for the Parental Control System.

## Database Engine
- **MongoDB**: Used for all persistent storage.

## Index Strategy
To optimize query performance for our most common access patterns, the following indexes are strictly maintained:

1. `users.email` (Unique) - Fast parent authentication.
2. `devices.parentId` and `devices.childId` - Device association lookups.
3. `activities.deviceId + timestamp` (Compound) - Retrieving chronological activity logs per device.
4. `locations.deviceId + timestamp` (Compound) - Tracking location history efficiently.
5. `messages.conversationId + createdAt` (Compound) - Fast family chat history loading.
6. `media.familyId + createdAt` (Compound) - Loading gallery assets.
7. `alerts.parentId + createdAt` (Compound) - Fetching dashboard notifications.
8. `safetyEvents.childId + timestamp` (Compound) - Real-time safety dashboard loading.
9. `auditLogs.familyId + timestamp` (Compound) - Retrieving security audit logs.

*Indexes are automatically applied during backend startup migrations.*

## Migrations
The system uses a lightweight startup migration runner (`backend/src/migrations/migrate.ts`) to ensure the database schema and indexes are up-to-date before accepting connections. 

## Automated Backups
A scheduled backup worker (`BackupWorker.ts`) runs periodically (e.g., every 24 hours).

### Backup Procedure
1. Creates an archive using `mongodump`.
2. (Pending Integration) Encrypts the archive.
3. (Pending Integration) Uploads to secure external storage (e.g., S3).
4. Verifies the archive structure.

### Restore Testing Procedure
To ensure backups are valid, perform this procedure monthly:
1. Download the latest encrypted backup from secure storage.
2. Decrypt the archive locally.
3. Restore to an isolated test database using `mongorestore`.
4. Validate critical collection counts (`parents`, `devices`, `children`).
5. Connect a local backend instance to the test database and run a health check.
