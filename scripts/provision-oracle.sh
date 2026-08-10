#!/usr/bin/env bash
#
# Provision an Oracle Cloud instance to run the Dignity Payload backend.
#
# Idempotent: safe to re-run. Contains NO secrets — it expects
# ~/app/dignity-backend/.env to already exist (written separately, out of band).
#
#   curl -fsSL https://raw.githubusercontent.com/talakherawish/Dignity/main/scripts/provision-oracle.sh | bash
#
set -euo pipefail

REPO_URL="https://github.com/talakherawish/Dignity.git"
APP_DIR="$HOME/app"
BACKEND_DIR="$APP_DIR/dignity-backend"
NODE_MAJOR=20

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[0;32m    ok: %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m    !! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[0;31mFAILED: %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- swap
# The E2.1.Micro shape has 1 GB of RAM, which is not enough to run a Next.js
# production build. Swap makes the build slow rather than impossible. On the
# larger A1 shapes this is harmless.
log "Swap"
if [ ! -f /swapfile ]; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  ok "4G swapfile created"
else
  sudo swapon /swapfile 2>/dev/null || true
  ok "swapfile already present"
fi

# ---------------------------------------------------------------- packages
log "Base packages"
sudo dnf install -y -q git curl tar gzip policycoreutils-python-utils >/dev/null
ok "git, curl, tar present"

log "Node.js ${NODE_MAJOR}"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt "$NODE_MAJOR" ]; then
  curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | sudo bash - >/dev/null
  sudo dnf install -y -q nodejs >/dev/null
fi
ok "node $(node -v), npm $(npm -v)"

log "pnpm + pm2"
command -v pnpm >/dev/null 2>&1 || sudo npm install -g pnpm >/dev/null 2>&1
command -v pm2  >/dev/null 2>&1 || sudo npm install -g pm2  >/dev/null 2>&1
ok "pnpm $(pnpm -v), pm2 $(pm2 -v 2>/dev/null | tail -1)"

log "nginx"
sudo dnf install -y -q nginx >/dev/null
ok "nginx installed"

# SELinux is enforcing on Oracle Linux images. Without this boolean nginx is
# denied outbound connections and every proxy_pass returns 502.
if command -v getsebool >/dev/null 2>&1 && [ "$(getenforce 2>/dev/null)" != "Disabled" ]; then
  sudo setsebool -P httpd_can_network_connect 1
  ok "SELinux httpd_can_network_connect enabled"
fi

# ---------------------------------------------------------------- firewall
log "Host firewall"
if systemctl is-active --quiet firewalld; then
  sudo firewall-cmd --permanent --add-service=http  >/dev/null
  sudo firewall-cmd --permanent --add-service=https >/dev/null
  sudo firewall-cmd --reload >/dev/null
  ok "firewalld: http, https opened"
else
  # Oracle Linux cloud images ship iptables rules that REJECT everything above 22.
  sudo iptables -I INPUT 1 -p tcp --dport 80  -j ACCEPT
  sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
  sudo bash -c 'iptables-save > /etc/iptables/rules.v4' 2>/dev/null \
    || sudo bash -c 'iptables-save > /etc/sysconfig/iptables' 2>/dev/null || true
  ok "iptables: 80, 443 accepted"
fi

# ---------------------------------------------------------------- source
log "Source"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --depth 1 origin main
  git -C "$APP_DIR" reset --hard origin/main
  ok "repo updated to $(git -C "$APP_DIR" rev-parse --short HEAD)"
else
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
  ok "repo cloned at $(git -C "$APP_DIR" rev-parse --short HEAD)"
fi

[ -f "$BACKEND_DIR/.env" ] || die "$BACKEND_DIR/.env is missing. Write it first, then re-run."
ok ".env present ($(grep -c '=' "$BACKEND_DIR/.env") vars)"

# ---------------------------------------------------------------- build
cd "$BACKEND_DIR"

log "Dependencies (this takes a few minutes)"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
ok "dependencies installed"

# package.json pins --max-old-space-size=8000, which a 1 GB machine cannot
# honour. Size the heap to the machine instead.
TOTAL_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
if   [ "$TOTAL_MB" -lt 2048 ];  then HEAP=1400
elif [ "$TOTAL_MB" -lt 8192 ];  then HEAP=3000
else                                 HEAP=6000
fi
log "Build (RAM ${TOTAL_MB}MB, heap ${HEAP}MB)"
warn "on a 1 GB shape this can take 15-25 minutes; do not interrupt"
NODE_OPTIONS="--no-deprecation --max-old-space-size=${HEAP}" npx next build
ok "build complete"

# ---------------------------------------------------------------- run
log "pm2"
cat > "$BACKEND_DIR/ecosystem.config.cjs" <<CONFIG
module.exports = {
  apps: [{
    name: 'dignity-backend',
    cwd: '$BACKEND_DIR',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    max_memory_restart: '${HEAP}M',
    env: { NODE_ENV: 'production', PORT: '3000', NODE_OPTIONS: '--no-deprecation' },
  }],
};
CONFIG

pm2 delete dignity-backend >/dev/null 2>&1 || true
pm2 start "$BACKEND_DIR/ecosystem.config.cjs"
pm2 save >/dev/null
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true
ok "pm2 running"

log "nginx reverse proxy"
# Written as a whole file: the stock nginx.conf ships its own `default_server`
# on :80, which collides with anything we drop into conf.d.
sudo tee /etc/nginx/nginx.conf >/dev/null <<'NGINX'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events { worker_connections 1024; }

http {
  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" "$http_user_agent"';
  access_log /var/log/nginx/access.log main;

  sendfile on;
  tcp_nopush on;
  keepalive_timeout 65;
  types_hash_max_size 4096;
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript
             application/x-javascript text/xml application/xml image/svg+xml;
  gzip_min_length 1024;

  upstream dignity_backend {
    server 127.0.0.1:3000;
    keepalive 32;
  }

  server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Payload media uploads
    client_max_body_size 100M;

    location / {
      proxy_pass http://dignity_backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade           $http_upgrade;
      proxy_set_header Connection        "upgrade";
      proxy_set_header Host              $host;
      proxy_set_header X-Real-IP         $remote_addr;
      proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Forwarded-Host  $host;
      proxy_cache_bypass $http_upgrade;
      proxy_connect_timeout 60s;
      proxy_send_timeout   300s;
      proxy_read_timeout   300s;
    }
  }
}
NGINX

sudo nginx -t
sudo systemctl enable --now nginx >/dev/null 2>&1 || true
sudo systemctl restart nginx
ok "nginx serving :80 -> :3000"

# ---------------------------------------------------------------- verify
log "Verify"
sleep 8
for i in $(seq 1 20); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/admin || echo 000)
  [ "$CODE" != "000" ] && break
  sleep 6
done
printf '    backend  http://127.0.0.1:3000/admin -> %s\n' "$CODE"
printf '    via nginx http://127.0.0.1/admin      -> %s\n' \
  "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/admin || echo 000)"

pm2 list

log "Done"
echo "    Admin:   http://\$(curl -s ifconfig.me)/admin"
echo "    Logs:    pm2 logs dignity-backend"
