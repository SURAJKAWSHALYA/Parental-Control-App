# Release Notes

## v1.0.0-rc.1 (Phase 8 - Final Release Candidate)

This release marks the final architectural hardening phase, bringing the system from a production-ready state to a highly reliable, secure, and scalable release candidate.

### Core Architecture & Reliability
- **Idempotency**: Introduced `Idempotency-Key` tracking to prevent duplicate operations and side-effects on flaky networks.
- **Dead Letter Queue (DLQ)**: Implemented an asynchronous job runner with exponential backoff for AI safety tasks and other critical background jobs, ensuring no data or analysis is lost during transient outages.
- **Configuration Versioning**: Added `configurationVersion` to devices to allow deterministic, versioned synchronization of rules (downtime, app limits, website rules) to prevent race conditions during offline sync.

### Advanced Security & Privacy
- **Security Session Management**: Explicitly tracking and validating sessions, allowing remote logout and invalidation of compromised tokens.
- **Immutable Audit Logs**: Upgraded audit logs with `requestId` tracing and status tracking for security forensics.
- **Re-Authentication Middleware**: Sensitive operations (e.g., deleting a family, inviting a co-parent) now require re-authentication.
- **Media Security**: Media endpoints are now protected using short-lived tokens and strict family-ownership validation.

### AI Safety Validation
- **Confidence Scoring**: AI classifications now emit structured confidence levels (`LOW`, `MEDIUM`, `HIGH`) and reasoning.
- **Graceful Degradation**: AI analysis seamlessly falls back to DLQ retry policies if the external model is unavailable.
- **False Positive Handling**: Integrated deduplication and manual review flows via the dashboard allow parents to override AI signals.

### Alerting & Observability
- **Request Tracing**: Global `X-Request-Id` injected across all API layers and included in standard structured JSON logs.
- **Alert Deduplication & Escalation**: Prevents alert fatigue by grouping identical, rapid-fire alerts. Automatic escalation of severity if identical issues persist (e.g., 3 consecutive medium alerts become high severity).
- **Dynamic Rate Limiting**: Shifted from IP-based rate limiting to Device/User identity-based rate limiting to protect API integrity on shared networks.
- **Backend Metrics**: Integrated latency and status code tracking middleware.

### Android Compatibility
- **Battery-Aware Sync**: Background sync explicitly respects battery states, deferring uploads if battery is critically low (<15%) and the device is not charging.
- **Permission Recovery Flow**: The child app now actively monitors core permissions (Location, Accessibility) and alerts parents immediately upon loss, while attempting local recovery flows.
- **Adaptive Location Polling**: Location polling intervals dynamically adjust based on battery state and movement to maximize tracking accuracy while preserving device life.

---
*Ready for user acceptance testing and final penetration tests.*
