# Production Setup Guide

## HTTPS Configuration

### Option 1: Using Nginx as Reverse Proxy (Recommended)

1. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Configure Nginx**
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

       # SSL Configuration
       ssl_certificate /path/to/your/certificate.crt;
       ssl_certificate_key /path/to/your/private.key;
       
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

3. **Enable SSL Certificate**
   ```bash
   # Using Let's Encrypt (Free)
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   
   # Or use your own certificates
   # Place your certificate files in /etc/ssl/certs/ and /etc/ssl/private/
   ```

4. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/server-automation /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 2: Using Node.js with HTTPS

1. **Generate SSL Certificate** (for development or self-signed)
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. **Update server.ts**
   ```typescript
   import https from 'https'
   import fs from 'fs'

   const httpsOptions = {
     key: fs.readFileSync('/path/to/key.pem'),
     cert: fs.readFileSync('/path/to/cert.pem')
   }

   https.createServer(httpsOptions, handler).listen(443)
   ```

## Environment Variables

Create `.env.production`:
```env
NODE_ENV=production
DATABASE_URL="file:./production.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## Security Considerations

### 1. JWT Secret
Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Security
- Use PostgreSQL or MySQL for production instead of SQLite
- Enable database encryption
- Regular backups

### 3. SSH Key Management
- Store SSH keys in environment variables or secure vault
- Use SSH key authentication instead of passwords
- Implement key rotation policies

### 4. Firewall Configuration
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Deployment with PM2

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 Config**
   Create `ecosystem.config.js`:
   ```javascript
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
       time: true
     }]
   }
   ```

3. **Start Application**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
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
       volumes:
         - ./data:/app/data
       restart: unless-stopped
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

## Monitoring and Logging

### 1. Application Monitoring
- Use PM2 monitoring: `pm2 monit`
- Set up health checks
- Monitor resource usage

### 2. Log Management
- Configure log rotation
- Use centralized logging (ELK stack, Grafana, etc.)
- Set up alerts for errors

### 3. Backup Strategy
- Regular database backups
- Configuration backups
- Disaster recovery plan

## Performance Optimization

### 1. Database Optimization
- Add proper indexes
- Use connection pooling
- Optimize queries

### 2. Caching
- Implement Redis for caching
- Use CDN for static assets
- Enable gzip compression

### 3. Load Balancing
- Use multiple app instances
- Configure load balancer
- Implement health checks

## Final Checklist

- [ ] HTTPS configured with valid SSL certificate
- [ ] Environment variables set correctly
- [ ] JWT secret is strong and secure
- [ ] Database is backed up regularly
- [ ] Firewall is configured
- [ ] Monitoring is set up
- [ ] Log rotation is configured
- [ ] SSL certificates are set to auto-renew
- [ ] Application is running in production mode
- [ ] Security headers are configured
- [ ] Regular security updates are applied