# Parental Control Application

A comprehensive parental control system featuring a parent dashboard, a REST API backend, and an Android client. The system allows parents to manage devices, enforce app limits, track screen time, locate children via GPS, monitor chat for cyberbullying, and receive real-time notifications.

## Architecture & Technology Stack

The system consists of three main components orchestrating real-time safety via WebSockets:

1. **Parent Dashboard** (React 18, Vite, Tailwind CSS, Recharts)
2. **Backend API** (Node.js, Express, MongoDB, Socket.IO, JWT)
3. **Child Android App** (Kotlin, WorkManager, Jetpack Compose, Room)

For an in-depth architectural breakdown, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Features (Phases 1-7)

- **Phase 1 (Core)**: Secure authentication, child profiles, and secure 6-digit PIN device pairing.
- **Phase 2 (Monitoring)**: App limits, Screen time analytics, Downtime schedules, and Offline rule caching.
- **Phase 3 (Location)**: Real-time GPS tracking, Location History, and Geofencing (Safe/Danger zones).
- **Phase 4 (Safety)**: Real-time SOS alerts, Fall detection, and notification deduplication.
- **Phase 5 (Communication)**: Encrypted Family Chat and Media Gallery uploads.
- **Phase 6 (Intelligence)**: Automated AI Safety Classification for detecting cyberbullying or inappropriate content in chat/media.
- **Phase 7 (Production)**: Comprehensive automated testing, Docker containerization, CI/CD, and IDOR prevention.

---

## Parent Setup Guide

1. **Create Parent Account**: Navigate to the web dashboard and register using a secure password.
2. **Add Child**: From the dashboard, add a child profile providing a name and age.
3. **Install Child App**: Download and install the release APK onto the child's Android device.
4. **Pair Device**: Open the app, generate a 6-digit PIN, and enter it into the Parent Dashboard to securely link the device.
5. **Grant Required Permissions**: On the child's device, follow the prompts to grant Location, Usage Stats, and Display Over Other Apps permissions.
6. **Configure Controls**: Set daily App Limits and overnight Downtime schedules.
7. **Configure Location**: Create safe Geofences (e.g., "School", "Home").
8. **Configure Safety**: Review and adjust AI Intelligence sensitivity if applicable.
9. **Configure Family Chat**: Send a welcome message via the Family Chat tab.
10. **Review Dashboard**: Verify the device's battery and online status on your homepage.

---

## Capability Matrix (Android Limitations)

To comply with Google Play Policies and Android OS sandboxing, certain features face strict limitations:

| Feature | Supported? | Required Permission | Android Limitation / Note |
|---------|-----------|--------------------|---------------------------|
| **Location** | ✅ Yes | `ACCESS_FINE_LOCATION` | Requires user consent. |
| **Background Location** | ✅ Yes | `ACCESS_BACKGROUND_LOCATION` | Requires manual selection of "Allow all the time". |
| **App Usage Tracking** | ✅ Yes | `PACKAGE_USAGE_STATS` | Must be granted via deep-link to Settings. |
| **App Blocking** | ⚠️ Partial | `SYSTEM_ALERT_WINDOW` | We overlay a "Blocked" screen. OS prevents force-closing third-party apps directly without Root. |
| **Call / SMS Logs** | ❌ No | `READ_CALL_LOG`, `READ_SMS` | Strictly prohibited by Google Play unless we are the default dialer. |
| **Camera/Mic Survalience** | ❌ No | N/A | We do not support covert spying. Violates ethical policies. |
| **Notifications** | ✅ Yes | `POST_NOTIFICATIONS` | Supported Android 13+. |

---

## Installation & Deployment

### Local Development
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd parent-dashboard
npm install
npm run dev
```

### Production Deployment (Docker)
Please refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying the `docker-compose.yml` stack with Nginx.

## Further Documentation
- [Security Architecture](./SECURITY.md)
- [API Documentation](./API.md)
- [Android Setup & Compilation](./ANDROID_SETUP.md)
- [Database & Backups](./DATABASE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
