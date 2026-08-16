# Troubleshooting Guide

This guide helps administrators and parents resolve common issues with the Parental Control System.

## Backend & API Issues

### 1. `500 Server Error` on Login or Registration
- **Cause**: Database connection failure or invalid Mongoose schema payload.
- **Fix**: Check `docker logs parental_control_backend`. Ensure the `MONGODB_URI` environment variable is correct and that the MongoDB container is running.

### 2. Socket.IO Connection Failing (Client sees "Authentication error")
- **Cause**: Missing, expired, or invalid JWT token in the Socket handshake.
- **Fix**: Ensure the client is sending the token in `auth: { token: "..." }`. If testing locally, ensure the token hasn't expired.

### 3. Media Uploads Failing (`413 Payload Too Large`)
- **Cause**: The photo/video exceeds the Multer configuration limits (default is typically 10MB/50MB).
- **Fix**: Adjust `limits: { fileSize }` in `upload.middleware.ts` or compress the media on the Android client before uploading.

### 4. Nginx Reverse Proxy Returning `502 Bad Gateway`
- **Cause**: Nginx is running, but the backend Node.js server has crashed or is unreachable.
- **Fix**: Run `docker-compose ps` to see if the backend container is restarting. Run `docker logs parental_control_backend` for the crash trace.

## Android Client Issues

### 1. Location Not Updating on Dashboard
- **Cause**: Android has killed the background Foreground Service to save battery, or the parent revoked Location Permissions.
- **Fix**: 
  - Ensure the device has Location turned ON.
  - Go to `Settings -> Apps -> Child App -> Battery` and set it to **"Unrestricted"**.
  - Ensure the parent granted `Allow all the time` for location.

### 2. App Limits Not Working
- **Cause**: `UsageStatsManager` permission is missing.
- **Fix**: The parent must navigate to Android Settings -> Security -> Usage Access, and toggle the permission on for the Child App.

### 3. Device Showing as "Offline"
- **Cause**: The child's device has lost internet connectivity, or the WebSocket was severed.
- **Fix**: The Android app uses exponential backoff to reconnect. It will cache location data and sync it when connectivity is restored. No action needed unless it persists for days, which implies the app was uninstalled or forcibly stopped.

## Contact Support
If critical infrastructure (MongoDB, Docker) fails to start, review the `DEPLOYMENT.md` configuration. Do not post production `.env` files in GitHub issues.
