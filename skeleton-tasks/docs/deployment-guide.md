# Deployment Guide

## Docker Deployment (Recommended)

### Development

```bash
docker-compose up --build
```

This starts PostgreSQL, the API server, and the Vite dev server with hot reload.

### Production

Create a `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: skeleton_tasks
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  server:
    build:
      context: .
      dockerfile: server/Dockerfile
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: skeleton_tasks
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      PORT: 3001
      NODE_ENV: production
      CORS_ORIGIN: https://yourdomain.com
      SEED_ON_START: "false"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pgdata:
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

In production, the Express server serves the built client as static files, so you only need the server and database containers.

## Manual Deployment

### Build Steps

```bash
# 1. Install dependencies
npm install

# 2. Build the server
npm run build -w server

# 3. Build the client
npm run build -w client

# 4. Run migrations
NODE_ENV=production npm run migrate

# 5. Start the server
NODE_ENV=production node server/dist/index.js
```

### Process Manager (PM2)

```bash
npm install -g pm2

# Start the server
pm2 start server/dist/index.js --name skeleton-tasks

# Save the process list
pm2 save

# Auto-start on boot
pm2 startup
```

### Systemd Service

Create `/etc/systemd/system/skeleton-tasks.service`:

```ini
[Unit]
Description=Skeleton Tasks API Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/skeleton-tasks/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001
EnvironmentFile=/opt/skeleton-tasks/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable skeleton-tasks
sudo systemctl start skeleton-tasks
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL hostname |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `skeleton_tasks` | Database name |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Database password |
| `PORT` | `3001` | Express server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | `development` or `production` |
| `SEED_ON_START` | (unset) | Set to `"true"` to seed DB on container start |

## PostgreSQL Setup

### Create the Database

```bash
# Using psql
createdb skeleton_tasks

# Or inside psql
CREATE DATABASE skeleton_tasks;
```

### User Permissions

For production, create a dedicated user:

```sql
CREATE USER skeleton_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE skeleton_tasks TO skeleton_app;
```

### Backups

```bash
# Backup
pg_dump -U postgres skeleton_tasks > backup.sql

# Restore
psql -U postgres skeleton_tasks < backup.sql
```

## Reverse Proxy (nginx)

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if serving client separately)
    location / {
        root /opt/skeleton-tasks/client/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## SSL/HTTPS

### Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically configure nginx and set up auto-renewal.

### With Docker

Use a reverse proxy container like `nginx-proxy` with `acme-companion` for automatic SSL in Docker deployments.
