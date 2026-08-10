# 🚀 Quick Backend Deployment (5 Steps)

## Tl;dr - Fast Track

### On Your Machine
```bash
# Make script executable
chmod +x deploy-backend.sh

# Copy to Oracle Cloud instance
scp -i dignity_key deploy-backend.sh opc@84.13.65.8:~/
```

### SSH into Oracle Cloud
```bash
ssh -i dignity_key opc@84.13.65.8
```

### Run Deployment
```bash
bash deploy-backend.sh
```

---

## Manual Setup (If Needed)

### 1️⃣ Connect
```bash
ssh -i dignity_key opc@84.13.65.8
```

### 2️⃣ Install Runtime
```bash
# Node.js 20+
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs npm pnpm

# PM2 (Process Manager)
npm install -g pm2

# Nginx (Reverse Proxy)
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Firewall
sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### 3️⃣ Deploy App
```bash
cd ~
git clone https://github.com/your-repo/dignity-academic-hub.git
cd dignity-academic-hub/dignity-backend

# Install
pnpm install

# Configure (create .env file with DATABASE_URL and PAYLOAD_SECRET)
nano .env

# Build
pnpm run build
```

### 4️⃣ Run
```bash
# Start with PM2
pm2 start "pnpm start" --name dignity-backend
pm2 save
pm2 startup
```

### 5️⃣ Access
- **Admin**: http://84.13.65.8/admin
- **API**: http://84.13.65.8/api

---

## .env Template

```bash
# MongoDB Atlas (recommended for Always Free)
DATABASE_URL=mongodb+srv://username:password@cluster0.mongodb.net/dignity?retryWrites=true&w=majority

# Payload Secret (generate with: openssl rand -hex 16)
PAYLOAD_SECRET=generate_a_32_char_random_string_here

# Optional
NODE_ENV=production
PORT=3000
```

---

## Monitoring

```bash
# Logs
pm2 logs dignity-backend

# Status
pm2 status

# Restart
pm2 restart dignity-backend

# Check System
free -h          # RAM
df -h            # Disk
ps aux | grep node  # Processes
```

---

## Instance Info
- **IP**: 84.13.65.8
- **User**: opc
- **OS**: Oracle Linux 9
- **CPU**: 1 OCPU
- **RAM**: 1 GB
- **Storage**: 50 GB
- **Cost**: FREE (Always Free Tier)

---

## Troubleshooting

**Port 3000 already in use?**
```bash
lsof -i :3000
kill -9 <PID>
```

**Low memory?**
```bash
sudo swapon --show  # Check swap
free -h             # Check RAM
```

**Nginx not working?**
```bash
sudo nginx -t       # Test config
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

**MongoDB connection failed?**
```bash
# Check .env DATABASE_URL
# Ensure IP whitelist on MongoDB Atlas (add 84.13.65.8)
```

---

## Performance Tips for 1GB Micro Instance

1. **Use MongoDB Atlas** (don't run local MongoDB)
2. **Enable PM2 memory limits** (900M max)
3. **Monitor with**: `watch -n 5 'free -h && ps aux | grep node'`
4. **Restart daily**: Set cron job with `pm2 save && pm2 startup`
5. **Log rotation**: Use PM2 log rotation

---

## What's Running
- **Node.js** - Backend runtime
- **Next.js** - Framework
- **Payload CMS** - Headless CMS
- **MongoDB** - Database (Atlas)
- **Nginx** - Reverse proxy & load balancer
- **PM2** - Process manager

## Ports
- **80** - HTTP (Nginx)
- **443** - HTTPS (when configured)
- **3000** - Next.js backend (internal)
- **27017** - MongoDB (if local, blocked by default)

---

## Success Checklist
- ✅ Instance running (84.13.65.8)
- ✅ SSH access working
- ✅ Node.js installed (v20+)
- ✅ Repository cloned
- ✅ `.env` configured
- ✅ Dependencies installed
- ✅ Build successful
- ✅ PM2 running backend
- ✅ Nginx forwarding traffic
- ✅ Admin accessible at http://84.13.65.8/admin

---

## Next: Frontend Deployment
See `FRONTEND_DEPLOYMENT_GUIDE.md` for Nuxt frontend setup
