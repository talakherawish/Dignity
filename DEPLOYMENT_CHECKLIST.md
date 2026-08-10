# 🚀 Dignity Backend Deployment Checklist

## Instance Details
- **IP**: 84.13.65.8
- **User**: opc
- **SSH Key**: dignity_key (in C:\Users\tala)

---

## Pre-Deployment Checklist ✅

### 1. Prepare Environment Variables
- [ ] Create MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- [ ] Create free cluster
- [ ] Get connection string
- [ ] Whitelist IP 84.13.65.8
- [ ] Generate PAYLOAD_SECRET: `openssl rand -hex 16`

### 2. Verify GitHub Access
- [ ] Repository is accessible
- [ ] Clone URL works locally

### 3. Verify SSH Access
```bash
# Test SSH connection
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8

# You should see Oracle Linux 9 prompt
# Then type: exit
```

---

## Step-by-Step Deployment

### **STEP 1: Connect to Instance**
```bash
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
```

### **STEP 2: Copy & Run Deployment Script**

**Option A: Download and Run**
```bash
# Inside SSH session on Oracle instance
curl -O https://raw.githubusercontent.com/your-repo/dignity-academic-hub/main/deploy-backend.sh
chmod +x deploy-backend.sh
bash deploy-backend.sh
```

**Option B: Copy from Local Machine**
```bash
# On your Windows machine, in PowerShell/CMD
scp -i C:\Users\tala\dignity_key C:\Users\tala\Projects\dignity-academic-hub\deploy-backend.sh opc@84.13.65.8:~/

# Then SSH and run:
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
bash deploy-backend.sh
```

### **STEP 3: Configure Environment During Deployment**

When the script prompts for .env configuration:

```
.env file not found!
📝 Please create .env with:
   DATABASE_URL=your_mongodb_connection_string
   PAYLOAD_SECRET=your_secret_key

Press Enter once .env is configured...
```

**Create .env file:**
```bash
# While still in SSH session (open another terminal tab):
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8

# Create .env
cat > ~/dignity-academic-hub/dignity-backend/.env << 'EOF'
DATABASE_URL=mongodb+srv://username:password@cluster0.mongodb.net/dignity?retryWrites=true&w=majority
PAYLOAD_SECRET=your_generated_32_char_secret_here
NODE_ENV=production
PORT=3000
EOF

# Verify it was created
cat ~/dignity-academic-hub/dignity-backend/.env

# Go back to original terminal and press Enter to continue deployment
```

---

## Deployment Timeline

| Step | Duration | Description |
|------|----------|-------------|
| 1. Update System | 2-3 min | System packages update |
| 2. Install Node.js | 1-2 min | Runtime installation |
| 3. Install pnpm | 1 min | Package manager |
| 4. Install PM2 | 1 min | Process manager |
| 5. Install Nginx | 1 min | Web server |
| 6. Firewall Setup | 1 min | Open ports |
| 7. Clone Repository | 1-2 min | Git clone |
| 8. Install Dependencies | 5-10 min | pnpm install |
| 9. Setup Environment | ~1 min | .env configuration |
| 10. Generate Types | 2-3 min | Payload types |
| **11. BUILD** | **5-15 min** | ⏳ **LONGEST STEP** |
| 12. Configure PM2 | 1 min | Process config |
| 13. Configure Nginx | 1 min | Reverse proxy |
| 14. Start Application | 2-3 min | Launch app |
| **TOTAL** | **30-50 min** | Complete deployment |

---

## What Happens During Deployment

### ✅ Systems Installed
- Node.js 20.x runtime
- pnpm package manager  
- PM2 process manager
- Nginx web server
- Firewall rules (ports 80, 443, 3000)

### ✅ Application Configured
- Repository cloned
- Dependencies installed
- Payload types generated
- Next.js build created
- PM2 ecosystem configured
- Nginx reverse proxy configured

### ✅ Service Started
- Backend running on port 3000
- Nginx listening on port 80
- PM2 managing process
- Logs available via `pm2 logs`

---

## Post-Deployment Verification

### Test Access
```bash
# Test from your machine
curl -I http://84.13.65.8

# Should return: HTTP/1.1 200 OK

# Or open in browser:
# http://84.13.65.8/admin
```

### Check Logs
```bash
# SSH into instance
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8

# View backend logs
pm2 logs dignity-backend

# View Nginx errors
sudo tail -f /var/log/nginx/error.log

# Check process status
pm2 status
```

### Verify Services
```bash
# Check Node.js running
ps aux | grep node

# Check Nginx running
sudo systemctl status nginx

# Check open ports
sudo netstat -tlpn | grep LISTEN
```

---

## Troubleshooting During Deployment

### Problem: "pnpm: command not found"
```bash
npm install -g pnpm
pnpm --version
```

### Problem: "permission denied" during .env creation
```bash
# Make sure you're in correct directory
cd ~/dignity-academic-hub/dignity-backend
ls -la .env
```

### Problem: Build takes too long (>15 min)
```bash
# Check available memory
free -h

# Monitor during build
watch -n 5 'ps aux | grep node'

# This is normal on 1GB Micro instance - be patient!
```

### Problem: Deployment hangs
```bash
# Cancel with Ctrl+C
# Check what's running
ps aux | grep node
ps aux | grep pnpm

# Kill if needed
pkill -f "pnpm\|node"
```

---

## Success Indicators

✅ Deployment complete when you see:
```
✅ Deployment Complete!
========================================

📍 Access Points:
  - Admin Panel: http://84.13.65.8/admin
  - API: http://84.13.65.8/api
  - GraphQL: http://84.13.65.8/api/graphql

📊 Useful Commands:
  - View logs: pm2 logs dignity-backend
  - Restart: pm2 restart dignity-backend
  - Status: pm2 status
```

✅ Verify by visiting: **http://84.13.65.8/admin**

---

## Post-Deployment Tasks

After deployment is complete:

### 1. Test API
```bash
curl -X GET http://84.13.65.8/api/health
# Should return 200 OK
```

### 2. Initialize Database
```bash
# SSH into instance
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8

# Run migrations if needed
cd ~/dignity-academic-hub/dignity-backend
pnpm run payload migrate
```

### 3. Create Admin User
```bash
# Access admin panel
# http://84.13.65.8/admin
# Follow Payload CMS setup wizard
```

### 4. Configure SSL (Optional but Recommended)
```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
# Update Nginx config to use SSL
```

### 5. Deploy Frontend
```bash
# See FRONTEND_DEPLOYMENT_GUIDE.md
```

---

## Monitoring & Maintenance

### Daily Tasks
```bash
# Check status
pm2 status

# View recent errors
pm2 logs dignity-backend --lines 50

# Check disk space
df -h
```

### Weekly Tasks
```bash
# Monitor memory usage
free -h

# Restart if needed (graceful)
pm2 restart dignity-backend

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Monthly Tasks
```bash
# Update system
sudo dnf update -y

# Backup database (if local)
# Or verify Atlas backups

# Review logs for errors
pm2 logs dignity-backend | grep ERROR
```

---

## Emergency Commands

```bash
# Stop everything
pm2 stop dignity-backend
pm2 delete dignity-backend
sudo systemctl stop nginx

# Restart everything
pm2 start ecosystem.config.js
sudo systemctl start nginx

# Emergency clean restart
pm2 kill
sudo systemctl restart nginx
pm2 start ecosystem.config.js

# View what's using memory
top
# Press 'M' to sort by memory, 'Q' to quit

# Free cache (be careful)
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

---

## Next Steps After Deployment

1. **✅ Backend Running** - You are here!
2. **→ Test API endpoints** - Verify health
3. **→ Deploy Frontend** - Nuxt application
4. **→ Configure Domain** - Point to your IP
5. **→ Setup SSL/HTTPS** - Secure connections
6. **→ Monitor & Scale** - Growth management

---

## Support & Resources

- Payload CMS Docs: https://payloadcms.com/docs
- Next.js Docs: https://nextjs.org/docs
- PM2 Docs: https://pm2.keymetrics.io/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Nginx Docs: https://nginx.org/en/docs/

---

## Deployment Status Tracker

- [ ] Pre-deployment checked
- [ ] SSH access verified
- [ ] MongoDB Atlas configured
- [ ] Secrets generated
- [ ] Deployment script running
- [ ] Dependencies installing
- [ ] Build completing
- [ ] PM2 starting
- [ ] Nginx configured
- [ ] Backend accessible
- [ ] Admin panel working
- [ ] Database initialized
- [ ] Ready for frontend!

---

**Good luck! 🚀**

This deployment will take approximately **30-50 minutes** depending on network speed and instance load.

Keep this checklist open and mark off items as you complete them!
