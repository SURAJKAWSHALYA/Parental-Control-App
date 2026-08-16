# Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Replace default nginx config with our custom proxy setup (optional/advanced)
# For standard SPA:
RUN echo $'server {\n\
    listen 80;\n\
    location / {\n\
        root   /usr/share/nginx/html;\n\
        index  index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    \n\
    # Socket.IO & API Proxy (if configured via Nginx instead of CORS)\n\
    location /api/ {\n\
        proxy_pass http://backend:3000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
    }\n\
    \n\
    location /socket.io/ {\n\
        proxy_pass http://backend:3000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
