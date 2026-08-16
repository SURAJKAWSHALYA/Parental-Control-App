# System Architecture

The Parental Control System consists of three main components: a Backend API (Node.js/Express), a Parent Dashboard (React/Vite), and a Child Client App (Android).

## Components

### 1. Backend API (Node.js & Express)
- **Role**: Central server handling authentication, business logic, WebSocket connections, and database interactions.
- **Key Technologies**:
  - `Express.js`: RESTful API endpoints.
  - `Mongoose`: MongoDB Object Data Modeling (ODM).
  - `Socket.IO`: Real-time bidirectional event-based communication.
  - `JWT (JSON Web Tokens)`: Stateless authentication.
  - `Multer`: Handling `multipart/form-data` for media uploads.
  - `Express-Rate-Limit`: API abuse prevention.
  
- **Core Modules**:
  - `auth`: Parent registration, login, and JWT validation.
  - `children` & `devices`: Managing the family hierarchy.
  - `location`: Ingestion and pagination of GPS records, Geofence evaluation.
  - `monitoring`: App usage limits, downtime schedules, and website restrictions.
  - `chat` & `media`: Bidirectional messaging with media uploads and safety classification.
  - `safety`: AI Intelligence reports and critical alert triggers.

### 2. Parent Dashboard (React SPA)
- **Role**: Web interface for parents to monitor and configure constraints for their children's devices.
- **Key Technologies**:
  - `React 18` + `Vite`
  - `Tailwind CSS`: Utility-first styling.
  - `Socket.IO Client`: Subscribing to real-time events (location updates, chat messages, SOS alerts).
  - `React Router`: Client-side routing.
  - `Chart.js / Recharts`: Visualizing screen time data and device health.

### 3. Child Client App (Android / Kotlin)
- **Role**: Background service running on the child's device, enforcing rules and harvesting telemetry.
- **Key Technologies**:
  - `Kotlin`: Primary language.
  - `WorkManager / Foreground Services`: Persistent background execution.
  - `Socket.IO Client`: Listening for immediate constraint updates (e.g., instant lock).
  - `Room Database`: Local caching for offline resilience.
  - `AccessibilityService / UsageStatsManager`: For enforcing app limits and website blocking.

## Infrastructure Diagram

```mermaid
graph TD
    A[Parent Dashboard (React)] -->|HTTPS REST| B(Backend API)
    A -->|WSS Socket.IO| B
    
    C[Child Android App] -->|HTTPS REST| B
    C -->|WSS Socket.IO| B
    
    B -->|Mongoose| D[(MongoDB)]
    B -->|Multer| E[Local File System / S3]
```

## Security & Isolation
- **IDOR Prevention**: All API routes validate `req.user.id` against the resource's `parentId` or `familyId`.
- **Rate Limiting**: Tiered limiters applied to Auth (strict), Media (medium), and API (standard).
- **Socket Authentication**: Connections require a valid JWT passed in the socket handshake `auth` payload.
