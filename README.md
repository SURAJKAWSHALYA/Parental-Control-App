# Parental Control System

A complete parental safety and monitoring solution comprised of a Node.js Backend API, a React Web Dashboard for parents, and an Android Application for child devices.

> **Note**: This is Phase 1 of the project, focusing strictly on foundational architecture, authentication, secure real-time socket connections, and device pairing. Advanced monitoring features (Screen Time, App Blocking, Location Tracking) are scheduled for Phase 2. No invasive or hidden surveillance is implemented.

## 🏗️ Architecture

1. **Parent Web Dashboard**: React 18, Vite, Tailwind CSS, Socket.IO Client. Modern SaaS UI for parents to manage their families.
2. **Backend API**: Node.js, Express, TypeScript, Mongoose. Provides secure REST APIs and real-time Socket.IO communication.
3. **Child Android App**: Kotlin, Jetpack Compose. Handles pairing setup and background heartbeat reporting.
4. **Database**: MongoDB.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB instance (local or Atlas)
- Android Studio (for compiling the Child App)

### 1. Database Setup
Ensure MongoDB is running locally on port `27017` or update the `MONGODB_URI` in your backend environment variables.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env # Update JWT_SECRET and URIs as needed
npm run dev
```
*The backend runs on `http://localhost:5000`.*

### 3. Parent Dashboard Setup
```bash
cd parent-dashboard
npm install
npm run dev
```
*The frontend runs on `http://localhost:3000`.*

### 4. Child Android App Setup
Open `child-android` in Android Studio. Ensure the emulator or device is connected to the same network as your backend, and run the app. During the setup wizard, input the 6-digit code generated from the Parent Dashboard.

## 🔒 Security Implementation

This project strictly adheres to ethical tracking practices:
- **No Hidden Surveillance**: The Android app explicitly declares its presence and permissions.
- **Cross-Parent Isolation**: Parents can exclusively access data associated with their own `childId` and `deviceId` through strict JWT and Mongoose query validation.
- **Socket Security**: Devices are authenticated via long-lived JWTs over WebSockets. Parents are joined to isolated `parent_{id}` Socket rooms to prevent cross-account traffic.
- **Pairing Expiry**: Pairing codes are strictly 6-alphanumeric characters, expire in 15 minutes (via MongoDB TTL), and are single-use.

## 📡 API Overview

### Authentication
- `POST /api/auth/register` - Create parent account
- `POST /api/auth/login` - Login parent
- `GET /api/auth/me` - Get current parent session
- `POST /api/auth/logout` - Clear session

### Children
- `GET /api/children` - List all children
- `POST /api/children` - Add new child
- `GET/PUT/DELETE /api/children/:id` - Manage specific child

### Pairing & Devices
- `POST /api/pairing/create` - Generate 15-min pairing code
- `POST /api/pairing/connect` - Connect Android device using code
- `GET /api/devices` - List all connected devices
- `DELETE /api/devices/:id` - Revoke device access
- `POST /api/devices/heartbeat` - Device background heartbeat
- `GET /api/devices/:id/status` - Real-time device status

## ⚡ Socket.IO Events

- `device:online` - Emitted when a child device connects.
- `device:offline` - Emitted on disconnect or missed heartbeats.
- `device:heartbeat` - Sent by the Android app to maintain connection.
- `parent:command` - Secure command channel (e.g. `request_sync`).
- `alert:new` - (Foundation) Server push notifications.

## 🛣️ Development Phases

### ✅ Phase 1: Foundation (Current)
- Monorepo setup, Database Models, JWT Auth, Real-time Architecture, Dashboard UI, Android Setup Stub.

### ⏳ Phase 2: Advanced Monitoring
- Screen Time schedules, App/Web filtering, GPS Location/Geofencing, and Notifications.
