# Parental Control System Setup

This document describes how to set up the Parental Control System for development and production environments.

## Architecture Overview

- **Frontend**: React (Vite, TailwindCSS)
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB
- **Mobile**: Android (Child Device)

## 1. Development Setup

### Backend
1. Navigate to the `backend` directory.
2. Copy `.env.example` to `.env`.
3. Fill in at minimum the `JWT_SECRET` and `MONGODB_URI` fields.
4. Install dependencies: `npm install`
5. Start development server: `npm run dev`

### Frontend
1. Navigate to the `parent-dashboard` directory.
2. Copy `.env.example` to `.env`.
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## 2. Production Setup

### Configuration Validation
The backend enforces strict configuration validation in production (`NODE_ENV=production`). If critical secrets like `JWT_SECRET` are missing, the server will intentionally crash on startup rather than default to insecure values.

### Backend Build & Run
1. Configure your production environment variables. Ensure `NODE_ENV=production`.
2. Build the project: `npm run build`
3. Start the project: `npm start` (Runs `node dist/server.js`)

### Frontend Build & Run
1. Configure your production environment variables (e.g., `VITE_API_URL` pointing to your real domain).
2. Build the project: `npm run build`
3. Host the output `dist` folder on a static server (e.g., Nginx, Vercel, S3).
