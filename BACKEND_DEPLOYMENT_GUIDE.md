# Dignity Backend Deployment to Oracle Cloud

## Instance Details
- **IP Address**: 84.13.65.8
- **Username**: opc
- **OS**: Oracle Linux 9
- **Instance Type**: VM.Standard.E2.1.Micro (Always Free)

## Prerequisites
- Node.js >= 20.9.0
- MongoDB (local or Atlas)
- pnpm package manager
- Git

---

## Phase 1: Initial Setup & Dependencies (SSH into the instance)

### 1. Connect via SSH
```bash
ssh -i dignity_key opc@84.13.65.8
```

### 2. Update System
```bash
sudo dnf update -y
sudo dnf install -y git curl wget nano
```

### 3. Install Node.js 20.x
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node --version  # Should be v20.x.x
npm --version
```

### 4. Install pnpm
```bash
npm install -g pnpm
pnpm --version
```

### 5. Install MongoDB (optional if using MongoDB Atlas)

**If using local MongoDB:**
```bash
sudo dnf install -y mongodb-org-server mongodb-org-tools
sudo systemctl start mongod
sudo systemctl enable mongod
```

**If using MongoDB Atlas (cloud):**
- Skip this step, use your Atlas connection string

---

## Phase 2: Deploy Application

### 1. Clone Repository
```bash
cd ~
git clone https://github.com/your-repo/dignity-academic-hub.git
cd dignity-academic-hub/dignity-backend
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Environment Variables
Create `.env` file:
```bash
cat > .env << 'EOF'
# For MongoDB Atlas (recommended for Always Free tier)
DATABASE_URL=mongodb+srv://username:password@cluster0.mongodb.net/dignity?retryWrites=true&w=majority

# For local MongoDB (if installed)
# DATABASE_URL=mongodb://localhost:27017/dignity

# Generate a secure secret (use: openssl rand -hex 16)
PAYLOAD_SECRET=your_secure_secret_here_32_chars_min
EOF
```

### 4. Generate Payload Types
```bash
pnpm run generate:types
```

### 5. Build Application
```bash
pnpm run build
```

**Note**: On a Micro instance (1GB RAM), this may take 5-10 minutes. Be patient.

---

## Phase 3: Run the Application

### Option A: Direct Start (Development)
```bash
pnpm start
# App will be available at http://84.13.65.8:3000
```

### Option B: Use Process Manager (Recommended for Production)

#### Install PM2
```bash
npm install -g pm2
```

#### Create PM2 Ecosystem Config
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dignity-backend',
    script: 'pnpm',
    args: 'start',
    cwd: '/home/opc/dignity-academic-hub/dignity-backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '900M'
  }]
};
EOF
```

#### Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Check Status
```bash
pm2 status
pm2 logs dignity-backend
```

---

## Phase 4: Networking & Access

### 1. Check Firewall
```bash
sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### 2. Access Backend
- **Admin Panel**: http://84.13.65.8:3000/admin
- **API**: http://84.13.65.8:3000/api
- **GraphQL**: http://84.13.65.8:3000/api/graphql

### 3. Setup Reverse Proxy (Nginx) - Optional but Recommended

```bash
sudo dnf install -y nginx
```

Create config:
```bash
sudo cat > /etc/nginx/conf.d/dignity.conf << 'EOF'
upstream dignity_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://dignity_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Start Nginx:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

Now access at: http://84.13.65.8 (port 80)

---

## Phase 5: Database Setup

### For MongoDB Atlas (Recommended):
1. Create free cluster at https://www.mongodb.com/cloud/atlas
2. Create database user
3. Whitelist Oracle Cloud IP (84.13.65.8)
4. Get connection string
5. Add to `.env`:
```
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/dignity?retryWrites=true&w=majority
```

### For Local MongoDB:
```bash
# Check if running
sudo systemctl status mongod

# Access mongo shell
mongosh

# Inside mongosh
use dignity
db.createCollection("payloadlocal__migrations")
exit
```

---

## Phase 6: SSL/HTTPS (Optional but Recommended)

### Install Certbot
```bash
sudo dnf install -y certbot python3-certbot-nginx
```

### Get SSL Certificate
```bash
sudo certbot certonly --standalone -d your-domain.com
```

### Update Nginx Config
```bash
# Update /etc/nginx/conf.d/dignity.conf to use SSL
```

---

## Monitoring & Troubleshooting

### Check Logs
```bash
# PM2 logs
pm2 logs dignity-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u mongodb -f
```

### System Resources
```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check processes
ps aux | grep node
```

### Restart Services
```bash
# Restart backend
pm2 restart dignity-backend

# Restart Nginx
sudo systemctl restart nginx
```

---

## Environment Variables Summary

```bash
# Required
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
PAYLOAD_SECRET=min_32_char_random_string

# Optional (Next.js)
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SERVER_URL=http://84.13.65.8
```

---

## Storage Limits (Always Free Tier)
- **RAM**: 1GB - Suitable for small deployments
- **Disk**: 50GB - Block storage available
- **Network**: Egress limited

### Optimization Tips
- Use MongoDB Atlas instead of local MongoDB (save disk space)
- Monitor memory with `free -h` regularly
- Set `max_memory_restart` in PM2 config

---

## Quick Deployment Checklist

- [ ] SSH access working
- [ ] Node.js 20+ installed
- [ ] pnpm installed
- [ ] Repository cloned
- [ ] `.env` file configured
- [ ] Dependencies installed (`pnpm install`)
- [ ] Build successful (`pnpm run build`)
- [ ] Database connected
- [ ] PM2 running backend
- [ ] Nginx reverse proxy configured
- [ ] Firewall rules updated
- [ ] Backend accessible at http://84.13.65.8

---

## Next Steps
1. Deploy frontend (Nuxt)
2. Configure domain (optional)
3. Setup SSL/HTTPS
4. Monitor performance
5. Scale if needed
