# Deployment Guide

This document outlines the procedure for deploying the Parental Control System to a production environment using Docker.

## Prerequisites
- A Linux server (Ubuntu/Debian recommended) or Cloud VM (AWS EC2, DigitalOcean Droplet, etc.)
- Docker and Docker Compose installed
- A registered domain name (e.g., `parental.example.com`)
- An SSL Certificate (e.g., via Let's Encrypt / Certbot)

## Architecture Overview
We use a `docker-compose.yml` to orchestrate three containers:
1. `mongodb`: The database.
2. `backend`: The Node.js Express API.
3. `frontend`: An Nginx container serving the built React SPA.

## Step-by-Step Deployment

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd parental-control-app
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (where `docker-compose.yml` is located):
```bash
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your_secure_db_password
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=https://yourdomain.com
```

### 3. Build and Start the Containers
```bash
docker-compose up --build -d
```
This command will:
- Build the backend image (compiling TypeScript to JavaScript).
- Build the frontend image (running Vite build and copying to Nginx).
- Start all services in the background.

### 4. Reverse Proxy & HTTPS (Nginx/Certbot)
While the `frontend` container exposes port 80, it is highly recommended to put an external reverse proxy (like Nginx on the host machine) in front of Docker to handle SSL termination.

**Example Host Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80; # Points to frontend docker container
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://localhost:3000; # Points to backend docker container
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 5. Media Storage
By default, the `docker-compose.yml` uses a Docker Volume (`backend_uploads`) to persist uploaded media files. 
- **Backups**: You should periodically back up `/var/lib/docker/volumes/parental-control-app_backend_uploads/_data` to an external storage provider (e.g., AWS S3) to prevent data loss.

### 6. Updating the Application
To deploy a new version:
```bash
git pull origin main
docker-compose up --build -d
```
This will rebuild the images and restart the containers with zero downtime if configured properly.
