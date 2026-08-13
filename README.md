# Parental Control Application

A comprehensive parental control system featuring a parent dashboard, a REST API backend, and an Android client. The system allows parents to manage devices, enforce app limits, track screen time, and receive real-time notifications about their child's device usage.

## Architecture

The system consists of three main components:

1. **Parent Dashboard** (React, Vite, TailwindCSS) - A responsive web UI for parents to manage children, pair devices, and view usage statistics.
2. **Backend API** (Node.js, Express, MongoDB, Socket.IO) - The central server handling authentication, device pairing, rule storage, data aggregation, and real-time socket communications.
3. **Child Android App** (Kotlin, Compose) - An Android client that monitors usage via `UsageStatsManager`, caches rules locally, and securely evaluates policies even when offline.

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Vite, React Router
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.IO, JWT, Helmet, CORS
- **Android**: Kotlin, Jetpack Compose, WorkManager, UsageStatsManager, SharedPreferences

## Features

### Phase 1: Core System
- **Authentication**: Secure JWT-based parent registration and login.
- **Child Management**: Create, edit, and delete child profiles.
- **Secure Device Pairing**: Link Android devices to children using short-lived 6-digit PIN codes.
- **Real-Time Heartbeat**: Devices report online/offline status and battery percentage via WebSockets.

### Phase 2: Core Parental Controls
- **Usage Monitoring**: Collects actual `UsageStats` from the Android OS and synchronizes it to the backend.
- **Screen Time Analytics**: Daily, 7-day, and 30-day interactive charts displaying usage distribution across apps.
- **App Limits**: Parents can define daily time limits for specific applications.
- **Downtime Schedules**: Configurable time blocks (e.g., Bedtime, School hours) that support overnight shifts (22:00-06:00).
- **Allowed Apps**: Exceptions (like Phone, Messages) that bypass all limit and downtime restrictions.
- **Real-Time Alerts**: Live notifications via Socket.IO for limit breaches, permission disablings, and device offline states. Intelligent deduplication suppresses spamming (15-minute cooldown per alert type).
- **Activity Timeline**: A chronological history of all device events.
- **Offline Rule Engine**: The Android client securely caches the latest rules. If the internet disconnects, limits and downtime continue to be enforced. When reconnected, a `SyncWorker` queue uploads pending usage logs.

## Android OS Limitations

> **Important**: This application does not use rooting, exploits, or hidden accessibility abuse.
If the Android OS sandbox does not natively permit force-closing a third-party application, the `AppRestrictionManager` engine will calculate the correct restriction policy (e.g., `LIMIT_REACHED`), but will gracefully log that "OS-level enforcement is unavailable with current Android capabilities." The dashboard truthfully reflects the intention, maintaining system integrity and user trust.

## Security Overview

- **Authentication**: All endpoints (except login/register/pairing verification) require a valid Bearer token.
- **Data Validation**: Strict Mongoose schemas and controller checks ensure malformed payloads (e.g., invalid downtime hours) are rejected.
- **Ownership Verification**: Every API request involving a device verifies that the requesting Parent owns the Child, and the Child owns the Device. Cross-parent contamination is impossible.
- **Socket Authentication**: Devices authenticate their socket connections using a securely stored device token generated during the pairing process.

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Instance (Local or Atlas)
- Android Studio (for client development)

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on environment variables below
npm run dev
```

### 2. Frontend Setup
```bash
cd parent-dashboard
npm install
npm run dev
```
The dashboard runs by default on `http://localhost:3000`.

### Environment Variables (Backend)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/parental-control
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
```
