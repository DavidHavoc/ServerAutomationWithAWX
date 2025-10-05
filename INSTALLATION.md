# Server Automation Platform - Installation & Configuration Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Setup](#production-setup)
4. [Configuration](#configuration)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Database Setup](#database-setup)
7. [Security Configuration](#security-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for package installation

### Required Software
```bash
# Verify Node.js and npm versions
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher

# Install Git if not present
sudo apt update && sudo apt install git  # Ubuntu/Debian
brew install git                          # macOS
```

---

## Development Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd server-automation-platform
```

### 2. Install Dependencies
```bash
# Install all npm dependencies
npm install

# This will install:
# - Next.js 15 with App Router
# - TypeScript 5
# - Tailwind CSS 4
# - Prisma ORM
# - shadcn/ui components
# - bcryptjs for password hashing
# - jose for JWT handling
# - And all other required packages
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

Add the following to your `.env` file:
```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET="your-development-jwt-secret-key"

# Application
NODE_ENV="development"
PORT=3000

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-development-nextauth-secret"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema to SQLite
npm run db:push

# (Optional) Seed demo data
curl -X POST http://localhost:3000/api/seed
```

### 5. Start Development Server
```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

### 6. Access the Application
- **URL**: http://localhost:3000
- **Login Page**: http://localhost:3000/login
- **Demo Credentials**:
  - Admin: `admin@example.com` / `admin123`
  - User: `user@example.com` / `user123`

---

## Production Setup

### Option 1: Traditional Server Deployment

#### 1. Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version && npm --version
```

#### 2. Application Deployment
```bash
# Clone the repository
git clone <your-repository-url> /var/www/server-automation
cd /var/www/server-automation

# Install dependencies
npm install --production

# Build the application
npm run build

# Set up environment
cp .env.example .env.production
nano .env.production
```

#### 3. Production Environment Configuration
```env
# Database (consider using PostgreSQL for production)
DATABASE_URL="file:./production.db"

# JWT Configuration (generate a strong secret)
JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-long"

# Application
NODE_ENV="production"
PORT=3000

# Next.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-nextauth-secret"
```

#### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Set up production database
npm run db:push

# Seed initial data (optional)
curl -X POST http://localhost:3000/api/seed
```

#### 5. Process Management with PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 configuration
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'server-automation',
    script: 'server.ts',
    interpreter: 'tsx',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# Create Dockerfile in project root
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./production.db
      - JWT_SECRET=${JWT_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped
```

#### 3. Deploy with Docker
```bash
# Create environment file
cat > .env << EOF
JWT_SECRET=your-super-secure-jwt-secret-key
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secure-nextauth-secret
EOF

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## Configuration

### Environment Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` | `file:./production.db` or PostgreSQL |
| `JWT_SECRET` | JWT signing secret | Any string | Strong 32+ character string |
| `NEXTAUTH_URL` | NextAuth URL | `http://localhost:3000` | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | NextAuth secret | Any string | Strong 32+ character string |
| `PORT` | Application port | `3000` | `3000` |

### Generate Secure Secrets
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NextAuth Secret
openssl rand -base64 32
```

---

## SSL/HTTPS Setup

### Option 1: Let's Encrypt with Nginx (Recommended)

#### 1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

#### 2. Configure Nginx
Create `/etc/nginx/sites-available/server-automation`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration (Let's Encrypt will handle this)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Obtain SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Self-Signed Certificate
```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt

# Generate DH parameters
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
```

---

## Database Setup

### SQLite (Development)
```bash
# Already configured with Prisma
# Database file: dev.db (development) or production.db (production)
```

### PostgreSQL (Production Recommended)
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE server_automation;
CREATE USER automation_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE server_automation TO automation_user;
\q

# Update environment variable
DATABASE_URL="postgresql://automation_user:secure_password@localhost:5432/server_automation"
```

### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Create migration file
npx prisma migrate dev --name init

# Seed initial data
curl -X POST http://localhost:3000/api/seed
```

---

## Security Configuration

### 1. Firewall Setup
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Application Security
```bash
# Set proper file permissions
chmod 600 .env.production
chmod 700 logs/
chmod 755 .

# Create dedicated user for application
sudo adduser --system --group --home /var/www/server-automation automation
sudo chown -R automation:automation /var/www/server-automation
```

### 3. SSH Security
```bash
# Disable password authentication (use keys only)
sudo nano /etc/ssh/sshd_config
# Add: PasswordAuthentication no
sudo systemctl restart ssh
```

### 4. Security Headers
The application includes security headers by default in production:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: "1; mode=block"
- Strict-Transport-Security: max-age=31536000

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### 2. Database Connection Issues
```bash
# Check database file permissions
ls -la *.db

# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: This deletes all data)
npx prisma migrate reset
```

#### 3. JWT Token Issues
```bash
# Clear browser cookies and localStorage
# Generate new JWT secret
# Restart application
pm2 restart all
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
chmod 600 .env.production
```

### Log Locations
- **Application Logs**: `logs/combined.log`
- **Error Logs**: `logs/err.log`
- **Nginx Logs**: `/var/log/nginx/`
- **PM2 Logs**: `pm2 logs`

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/health

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx
```

---

## Maintenance

### 1. Regular Updates
```bash
# Update Node.js dependencies
npm update

# Update system packages
sudo apt update && sudo apt upgrade

# Update SSL certificates
sudo certbot renew
```

### 2. Database Maintenance
```bash
# Backup SQLite database
cp production.db backups/production-$(date +%Y%m%d).db

# For PostgreSQL, use pg_dump
pg_dump server_automation > backups/db-$(date +%Y%m%d).sql
```

### 3. Log Rotation
Create `/etc/logrotate.d/server-automation`:
```
/var/www/server-automation/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 automation automation
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Monitoring Setup
```bash
# Monitor PM2 processes
pm2 monit

# Set up monitoring with PM2 Plus (optional)
pm2 plus

# Basic monitoring script
#!/bin/bash
# health-check.sh
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Application is down, restarting..."
    pm2 restart server-automation
fi
```

### 5. Backup Strategy
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/server-automation"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp /var/www/server-automation/production.db $BACKUP_DIR/db_$DATE.db

# Backup configuration
cp /var/www/server-automation/.env.production $BACKUP_DIR/env_$DATE

# Backup SSL certificates
tar -czf $BACKUP_DIR/ssl_$DATE.tar.gz /etc/ssl/certs/

# Keep only last 30 days
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "env_*" -mtime +30 -delete
find $BACKUP_DIR -name "ssl_*.tar.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /var/www/server-automation/backup.sh" | crontab -
```

---

## Quick Start Summary

### Development
```bash
git clone <repo>
cd server-automation-platform
npm install
cp .env.example .env
npm run db:push
npm run dev
# Visit http://localhost:3000
```

### Production
```bash
# On server
git clone <repo> /var/www/server-automation
cd /var/www/server-automation
npm install --production
npm run build
cp .env.example .env.production
# Edit .env.production with secure values
npm run db:push
pm2 start ecosystem.config.js
# Configure Nginx reverse proxy with SSL
```

---

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review application logs: `pm2 logs`
3. Verify environment configuration
4. Check network connectivity and firewall settings
5. Ensure all dependencies are properly installed

The platform is now ready for both development and production use with comprehensive security, monitoring, and maintenance procedures in place.