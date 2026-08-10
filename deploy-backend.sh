#!/bin/bash

# Dignity Backend Deployment Script for Oracle Cloud
# Usage: bash deploy-backend.sh

set -e  # Exit on error

echo "🚀 Starting Dignity Backend Deployment..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update System
echo -e "${BLUE}Step 1: Updating system...${NC}"
sudo dnf update -y
sudo dnf install -y git curl wget nano

# Step 2: Install Node.js
echo -e "${BLUE}Step 2: Installing Node.js 20.x...${NC}"
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"

# Step 3: Install pnpm
echo -e "${BLUE}Step 3: Installing pnpm...${NC}"
npm install -g pnpm
echo -e "${GREEN}✓ pnpm $(pnpm --version) installed${NC}"

# Step 4: Install PM2
echo -e "${BLUE}Step 4: Installing PM2...${NC}"
npm install -g pm2
pm2 startup
echo -e "${GREEN}✓ PM2 installed${NC}"

# Step 5: Install Nginx
echo -e "${BLUE}Step 5: Installing Nginx...${NC}"
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
echo -e "${GREEN}✓ Nginx installed and started${NC}"

# Step 6: Setup Firewall
echo -e "${BLUE}Step 6: Configuring firewall...${NC}"
sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
sudo firewall-cmd --zone=public --add-port=443/tcp --permanent
sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
echo -e "${GREEN}✓ Firewall configured${NC}"

# Step 7: Clone and Setup Application
echo -e "${BLUE}Step 7: Cloning repository...${NC}"
cd ~
if [ ! -d "dignity-academic-hub" ]; then
    git clone https://github.com/your-repo/dignity-academic-hub.git
else
    cd dignity-academic-hub
    git pull
    cd ..
fi

cd dignity-academic-hub/dignity-backend

# Step 8: Install Dependencies
echo -e "${BLUE}Step 8: Installing dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 9: Setup Environment
echo -e "${BLUE}Step 9: Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Please create .env with:"
    echo "   DATABASE_URL=your_mongodb_connection_string"
    echo "   PAYLOAD_SECRET=your_secret_key"
    read -p "Press Enter once .env is configured..."
fi

# Step 10: Generate Types
echo -e "${BLUE}Step 10: Generating Payload types...${NC}"
pnpm run generate:types
echo -e "${GREEN}✓ Types generated${NC}"

# Step 11: Build Application
echo -e "${BLUE}Step 11: Building application...${NC}"
echo "⏳ This may take 5-10 minutes on Micro instance..."
pnpm run build
echo -e "${GREEN}✓ Build completed${NC}"

# Step 12: Configure PM2
echo -e "${BLUE}Step 12: Configuring PM2...${NC}"
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
    max_memory_restart: '900M',
    error_file: '/home/opc/.pm2/logs/dignity-backend-error.log',
    out_file: '/home/opc/.pm2/logs/dignity-backend-out.log'
  }]
};
EOF

# Step 13: Configure Nginx
echo -e "${BLUE}Step 13: Configuring Nginx...${NC}"
sudo cat > /etc/nginx/conf.d/dignity.conf << 'EOF'
upstream dignity_backend {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo nginx -t
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured${NC}"

# Step 14: Start Application
echo -e "${BLUE}Step 14: Starting application with PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✓ Application started${NC}"

# Final Summary
echo ""
echo -e "${GREEN}========================================"
echo "✅ Deployment Complete!"
echo "========================================${NC}"
echo ""
echo -e "${BLUE}📍 Access Points:${NC}"
echo "  - Admin Panel: http://84.13.65.8/admin"
echo "  - API: http://84.13.65.8/api"
echo "  - GraphQL: http://84.13.65.8/api/graphql"
echo ""
echo -e "${BLUE}📊 Useful Commands:${NC}"
echo "  - View logs: pm2 logs dignity-backend"
echo "  - Restart: pm2 restart dignity-backend"
echo "  - Status: pm2 status"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  1. Test API endpoints"
echo "  2. Deploy frontend (Nuxt)"
echo "  3. Configure domain (optional)"
echo "  4. Setup SSL/HTTPS (optional)"
echo ""
