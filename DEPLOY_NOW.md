# 🎯 Deploy Backend RIGHT NOW - Interactive Guide

## ⏱️ Time Required: 30-50 minutes

---

## STEP 1: Prepare Your Secrets (5 minutes)

### Generate PAYLOAD_SECRET
Open PowerShell and run:
```powershell
# On Windows PowerShell
$secret = [System.Guid]::NewGuid().ToString().Replace("-", "")
Write-Host $secret
# Copy the output - this is your PAYLOAD_SECRET
```

**Note this down:**
```
PAYLOAD_SECRET = ________________________________
```

### Get MongoDB Connection String
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or login (FREE tier available)
3. Create a cluster (takes ~5 min)
4. Click "Connect"
5. Choose "Drivers"
6. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true`

**Note this down:**
```
DATABASE_URL = ________________________________
```

**⚠️ IMPORTANT:** Whitelist Oracle IP
- In MongoDB Atlas → Network Access → Add IP Address
- Enter: `84.13.65.8`
- Click Allow

---

## STEP 2: Test SSH Access (2 minutes)

Open PowerShell/CMD and run:
```bash
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
```

✅ **You should see:**
```
[opc@dignity-app ~]$
```

Type: `exit`

---

## STEP 3: Copy Deployment Script (2 minutes)

### Method A: Via SCP (Recommended)
```bash
# In PowerShell, in your project directory
cd C:\Users\tala\Projects\dignity-academic-hub

# Copy script to instance
scp -i C:\Users\tala\dignity_key deploy-backend.sh opc@84.13.65.8:~/
```

You should see:
```
deploy-backend.sh                                     100% 9.2KB
```

---

## STEP 4: SSH Into Instance & Run Script (3 minutes setup + 30-45 min execution)

### Open Terminal Session
```bash
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
```

You're now on your Oracle instance! ✅

### Run Deployment
```bash
bash ~/deploy-backend.sh
```

**You'll see this output starting:**
```
🚀 Starting Dignity Backend Deployment...
========================================

[BLUE]Step 1: Updating system...[NC]
... lots of output ...
```

---

## STEP 5: When Script Asks for .env Configuration

The script will pause and show:
```
⚠️  .env file not found!
📝 Please create .env with:
   DATABASE_URL=your_mongodb_connection_string
   PAYLOAD_SECRET=your_secret_key

Press Enter once .env is configured...
```

### DO NOT PRESS ENTER YET!

**Open a NEW terminal tab** and:
```bash
# NEW TAB/WINDOW - Connect again
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8

# Create .env with your values
cat > ~/dignity-academic-hub/dignity-backend/.env << 'EOF'
DATABASE_URL=mongodb+srv://user:password@cluster0.mongodb.net/dignity?retryWrites=true&w=majority
PAYLOAD_SECRET=your_secret_from_step_1_here
NODE_ENV=production
PORT=3000
EOF

# Verify it worked
cat ~/dignity-academic-hub/dignity-backend/.env
```

You should see:
```
DATABASE_URL=mongodb+srv://...
PAYLOAD_SECRET=...
NODE_ENV=production
PORT=3000
```

### Now Go Back to First Tab
Press **Enter** in the original deployment tab to continue.

---

## STEP 6: Wait for Build (5-15 minutes)

You'll see:
```
[BLUE]Step 11: Building application...[NC]
⏳ This may take 5-10 minutes on Micro instance...
```

**BE PATIENT!** This is the longest step. The instance is compiling Next.js.

Monitor with:
```bash
# In a new terminal tab
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
watch -n 5 'free -h && ps aux | grep node'
```

Press Ctrl+C to exit watch.

---

## STEP 7: See Success Message (1 minute)

When complete, you'll see:
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
  - Nginx logs: sudo tail -f /var/log/nginx/error.log

⚠️  Next Steps:
  1. Test API endpoints
  2. Deploy frontend (Nuxt)
  3. Configure domain (optional)
  4. Setup SSL/HTTPS (optional)
```

---

## STEP 8: Verify Deployment (2 minutes)

### In the SAME SSH session:
```bash
# Check if backend is running
pm2 status

# Should show:
# ┌─────────┬─────┬──────┬───────┬───────┬──────────┐
# │ id      │ ... │ pm2 id│ ...
# ├─────────┼─────┼──────┼───────┼───────┼──────────┤
# │ dignity │ ... │ 0    │ ...   │ 0     │ 900M     │
# └─────────┴─────┴──────┴───────┴───────┴──────────┘
```

### View recent logs:
```bash
pm2 logs dignity-backend --lines 20
```

Should show `listening on port 3000` or similar.

---

## STEP 9: Test in Browser (1 minute)

Open your browser:
```
http://84.13.65.8/admin
```

You should see the Payload CMS admin interface! 🎉

---

## STEP 10: First Time Setup (5 minutes)

1. Visit: http://84.13.65.8/admin
2. Click "Initialize Database"
3. Create first admin user
4. Set password
5. Login!

---

## ✅ Success Checklist

- [ ] PAYLOAD_SECRET generated
- [ ] MongoDB Atlas cluster created
- [ ] DATABASE_URL copied
- [ ] IP 84.13.65.8 whitelisted in MongoDB
- [ ] SSH connection working
- [ ] Script copied to instance
- [ ] Deployment script started
- [ ] .env file created on instance
- [ ] Build completed
- [ ] pm2 shows "online" status
- [ ] Admin panel accessible at http://84.13.65.8/admin

---

## 🆘 If Something Goes Wrong

### Script hangs or fails?
```bash
# Stop everything
pm2 kill
sudo systemctl stop nginx

# Check what's running
ps aux | grep node
ps aux | grep pnpm

# Clear and retry
rm -rf ~/dignity-academic-hub
# Then run script again
```

### Can't connect to MongoDB?
```bash
# Check .env file
cat ~/dignity-academic-hub/dignity-backend/.env

# Verify connection string
# - Username correct?
# - Password correct?
# - IP whitelisted? (84.13.65.8 in MongoDB Atlas)
```

### Low memory?
```bash
# Check free space
free -h

# If <200MB free, restart
pm2 restart dignity-backend
```

### Port 80 not working?
```bash
# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# If broken, restart
sudo systemctl restart nginx
```

---

## 📊 Monitoring During Deployment

Keep these commands handy:

```bash
# Terminal 1: Main deployment
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
bash ~/deploy-backend.sh

# Terminal 2: Monitor resources
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
watch -n 5 'free -h'

# Terminal 3: Watch logs
ssh -i C:\Users\tala\dignity_key opc@84.13.65.8
pm2 logs dignity-backend
```

---

## 🎉 What's Next?

After successful deployment:

1. ✅ **Backend is LIVE!**
   - Admin: http://84.13.65.8/admin
   - API: http://84.13.65.8/api

2. **→ Deploy Frontend**
   - Follow `FRONTEND_DEPLOYMENT_GUIDE.md`
   - Deploy Nuxt to same or separate instance

3. **→ Connect Domain** (optional)
   - Point your domain to 84.13.65.8
   - Configure DNS records

4. **→ Setup SSL/HTTPS** (recommended)
   - Free SSL via Let's Encrypt
   - See `BACKEND_DEPLOYMENT_GUIDE.md`

---

## 💾 Backup Your .env

**IMPORTANT: Save your .env locally!**

```bash
# Copy from instance to your machine
scp -i C:\Users\tala\dignity_key opc@84.13.65.8:~/dignity-academic-hub/dignity-backend/.env C:\Users\tala\.env.backup

# Keep this safe - it has your database credentials!
```

---

## 🚀 Ready to Deploy?

**Total time: ~45 minutes**

1. Open PowerShell
2. Generate secrets (STEP 1)
3. Test SSH (STEP 2)
4. Copy script (STEP 3)
5. Run deployment (STEP 4+)
6. Watch it build
7. Test in browser
8. Success! 🎉

**Let's go! Start with STEP 1 now →**

---

**Questions?** Check `BACKEND_DEPLOYMENT_GUIDE.md` for detailed explanations.

**Emergency?** Check troubleshooting section above.

**Progress tracking:** Mark off ✅ in the Success Checklist as you complete each step!
