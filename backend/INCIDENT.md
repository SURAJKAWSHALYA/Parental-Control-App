# Incident Management & Disaster Recovery

## Incident Response Plan

This document outlines the standard operating procedures for managing incidents in the Parental Control System.

### 1. Severity Levels

- **SEV-1 (CRITICAL)**: System completely down, data loss occurring, or major security breach. All hands on deck. Response SLA: 15 minutes.
- **SEV-2 (HIGH)**: Core feature degraded (e.g., location syncing down, real-time alerts delayed) affecting many users. Response SLA: 1 hour.
- **SEV-3 (MEDIUM)**: Non-critical feature broken or isolated issue affecting few users. Response SLA: 4 hours.
- **SEV-4 (LOW)**: Minor bug or cosmetic issue. Handled in standard sprint planning.

### 2. Incident Commander (IC)

The first responder to a SEV-1/SEV-2 becomes the Incident Commander. The IC coordinates communication, delegates investigation, and maintains the incident log.

### 3. Communication Channels

- **Internal**: #incident-response Slack channel.
- **External**: Update the status page (status.example.com).

### 4. Post-Mortem

Within 48 hours of a SEV-1/SEV-2 resolution, a blameless post-mortem must be conducted and documented, answering:
- What happened?
- Why did it happen? (5 Whys)
- How did we respond?
- What are the action items to prevent recurrence?

## Disaster Recovery

### Database Recovery

1.  **MongoDB Backups**: Automated snapshots are taken every 6 hours via Atlas.
2.  **Point-In-Time Recovery**: We maintain a 7-day oplog window for PITR.
3.  **Restore Process**:
    - Identify the point of corruption/data loss.
    - Provision a temporary isolated cluster.
    - Restore snapshot to the temporary cluster.
    - Verify data integrity.
    - Switch connection strings in environment variables to point to the recovered cluster.

### AI Service Fallback

If the primary AI Safety Analysis service fails:
- The system automatically enters exponential backoff using the DLQ (`jobRunner.ts`).
- Failed jobs are preserved in the `FailedJob` collection.
- Administrators can manually trigger replay via the API once the AI service is restored.

### Redis Cache/Socket Layer Failure

If Redis fails:
- Socket connections will gracefully fall back to single-node memory adapters.
- Cross-node broadcasting will be degraded, but local clients on the same node will continue to receive real-time updates.
- Bring up a new Redis instance and update the `REDIS_URL`.

### Audit Logs

Audit logs are immutable. If tampering is suspected:
- Lock down the database immediately.
- Export the current `AuditLog` collection.
- Analyze the `requestId` and `ipHash` correlations to identify the compromised actor.
