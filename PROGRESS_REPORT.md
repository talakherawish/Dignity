# Dignity Initiative — Progress Report
**Updated:** 2026-08-11  
**Reporting period:** 2026-08-08 to 2026-08-11

---

## Summary

**The site is fully deployed and self-maintaining.** Frontend and backend both run on one Oracle Cloud instance behind a single certificate at **https://84-13-77-162.sslip.io** — public site at `/`, Payload admin at `/admin`. Content comes from MongoDB Atlas.

Infrastructure work is finished. HTTPS renews itself, backups run nightly and have been verified by restoring one, GitHub and the server hold identical code, and deployment is a single tested command.

**Oracle is the permanent home.** The university has no hosting capacity; they will only map a domain to this IP. Backups, uptime and deployment are therefore ours to own.

What remains is content entry, not engineering.

---

## Completed This Week

### Oracle Cloud Backend Deployment (8 hrs, 2026-08-08)
- **What:** Migrated Payload backend from dead Vercel deployment to Oracle Cloud Always Free tier.
- **Instance:** ARM A1 Compute (2 OCPU / 12GB RAM / 200GB storage), IP `84.13.77.162`, hostname `dignity-prod`.
- **Deployment method:** git clone at `/home/opc/app`, Payload run under pm2 (no Docker).
- **Database:** Still on MongoDB Atlas (no migration needed; worked through Vercel, works now).
- **Storage:** Local disk at `/home/opc/app/public/uploads` — files persist across restarts.
- **HTTPS:** Auto-issued via sslip.io (`84-13-77-162.sslip.io`); valid for 90 days.

### Login Fixed (critical debug, same 8 hrs)
- **Problem:** Admin login appeared to work (POST 200), but session dropped on next request (bounced to login screen).
- **Root cause:** Plain HTTP on a bare IP. Browsers won't keep login cookies in that setup — it's a browser-level security rule, not a code bug. Password and database were never the issue.
- **Solution:** Served admin over HTTPS with a real hostname (`84-13-77-162.sslip.io`). Session now persists.
- **Result:** Full end-to-end login confirmed:
  - Login POST: 200 ✓
  - Session fetch (/me): 200, returns `user: talakherawish@gmail.com` ✓
  - Dashboard navigation: loads full UI, session holds ✓

### Admin Accounts Status
- **Tala (talakherawish@gmail.com):** ✓ Live and tested. Password: `Dignity2026!` (temporary, change it).
- **Asil (ahousin@birzeit.edu):** Password fields open on edit page; just needs password entry and Save. Not done yet — picked up tomorrow.

---

## Current State (as of today)

**Backend:** https://84-13-77-162.sslip.io/admin (working)
- Tala login: working
- Asil login: pending password set
- Database connectivity: confirmed
- File upload path: `/srv/payload-uploads` on host (monitored, stable)
- SSL cert: auto-issued, expires ~2026-11-08

**Frontend:** Still points `VITE_PAYLOAD_URL` at old dead Vercel URL — **not updated yet** (not blocking, can test via direct admin URL for now).

**HTTPS auto-renewal — DONE and verified (2026-08-10)**

- `certbot-renew.timer` runs 03:00 and 15:00 daily (`RandomizedDelaySec=1h`, `Persistent=true`)
- `certbot-renew.service` stops nginx, renews, starts nginx — roughly 20 seconds of downtime, twice a year, overnight
- Verified with a dry run: *"all simulated renewals succeeded"*, nginx active afterwards, site 200
- `--no-random-sleep-on-renew` and `TimeoutStartSec=600` are both required. certbot otherwise sleeps up to 8 minutes and systemd kills it at 90 seconds — the renewal would fail silently every time.

## Server / GitHub reconciled — DONE (2026-08-10)

They had diverged both ways. Now aligned at commit `415847b`.

- All local work committed and pushed (collection restructure, frontend updates, removal of the ignored `admin.position` keys)
- `.gitignore` now excludes `dignity_key` (an SSH **private key** sitting in the project root) and `frontend.zip` (~158MB, over GitHub's 100MB limit). Both would have been committed by a plain `git add .`
- Server pulled, dependencies installed, Payload rebuilt, restarted under pm2
- **Security fix:** the server was running `auth: { cookies: { secure: false } }`, left over from HTTP debugging. Pulling restored `auth: true`, so the admin login cookie is properly Secure again.
- Research content confirmed present and rendering — it was missing only because the server was running older code

**How deployment actually works — there is no CI.** Pushing to GitHub deploys nothing.
- Backend: git clone at `/home/opc/app`, run by **pm2** as `dignity-backend`. Update = `git pull` → `npm install` → `npm run build` → `pm2 restart`
- Frontend: built on the laptop, zipped, uploaded via Cloud Shell, `scp`'d, `systemctl restart dignity-frontend`

## Backups — DONE and restore-tested (2026-08-10)

- `/usr/local/bin/dignity-backup.sh` via `dignity-backup.timer`, nightly 02:00, **14 days retained**
- One archive holds both the database dump and all uploads: first run was **151MB, 65 upload files**
- Stored at `/home/opc/backups`, mode 600
- **Verified by restoring into a scratch database**, not just by checking a file exists

**Gap worth closing:** all copies live on the same instance. They protect against mistakes, not against losing the machine. Off-server copy is manual — `scp` the newest archive to Cloud Shell, then Menu → Download. Worth doing after big content sessions.

## One-command deploy — DONE and tested (2026-08-11)

```
ssh -i ~/.ssh/dignity opc@84.13.77.162 '/usr/local/bin/deploy'
```

Pulls from GitHub, builds both halves **on the server**, swaps the frontend into place, restarts both services, then checks `/`, `/admin` and the API and prints the status codes.

- **Builds run before anything restarts** — a failed build leaves the live site untouched
- Previous frontend kept at `/srv/dignity-frontend.old` for rollback
- `git reset --hard origin/main`, so the server exactly mirrors GitHub. **Anything edited directly on the server is wiped** — all changes go through GitHub now. That is the permanent fix for the drift found on 2026-08-10.
- Frontend builds on the server so `VITE_PAYLOAD_URL` comes from one known place, rather than depending on a laptop's `.env`

**A bug the test caught:** the first run passed, the second failed — removing `/srv/dignity-frontend.old` needs `sudo`, because deleting a directory requires write permission on its parent and `/srv` is root-owned. Every run after the first would have failed. Fixed and re-verified on a repeat run. Worth remembering: running a new script **twice** is the test that matters.

Known warning, harmless for now: server Node is v20, TanStack Start wants ≥22, so installs print `EBADENGINE`. Builds succeed. Watch it if that changes.

---

## Database decision — staying on MongoDB Atlas

Considered moving MongoDB onto the Oracle instance for single-vendor tidiness. **Decided against it.**

- Payload has no Oracle Autonomous Database adapter, so "move to Oracle's database" was never actually available — only self-hosting MongoDB on the instance.
- Atlas replicates across three nodes; a single instance has one disk. Self-hosting would trade real resilience for neatness, and make uptime and backups ours.
- Atlas free tier caps at 512MB; the database is ~100KB compressed. PDFs live on the server, not in the database, so the cap is not a constraint.
- The nightly backup already dumps Atlas onto the Oracle box, so there is an independent copy regardless.

---

## Remaining work

1. **Populate the site** — the main task now, and safe to do; backups are running.
2. Set password for `ahousin@birzeit.edu` (2 min).
3. Change Tala's temporary password (`Dignity2026!`).
4. Google Drive workspace as an independent, browsable copy of the documents — upload all 64 files from `public/uploads`, **including the `-thumb.png` files**, since those are the PDF cover previews the site displays. Verified 2026-08-11 that the local folder exactly matches the server: 64 files, 155MB, 30 PDFs.
5. Optional: copy a backup archive off the server after big content sessions — all 14 copies currently live on the same machine.

---

## What Changed vs. Earlier Plan
The HOSTING_PLAN.md from July recommended Vercel + Vercel Blob. **That plan is now superseded.** Reason: Oracle Cloud's free tier is actually reliable and has a real persistent disk, which is what Payload really wants. One-time setup cost was higher, but the result is simpler long-term (no serverless cold starts, no ephemeral storage quirks). This also avoids the "finish once, don't touch again" requirement better than a serverless stack would.

---

## Frontend Deployment — DONE (2026-08-10)

Frontend and backend now both live on **https://84-13-77-162.sslip.io** — one domain, one certificate, one instance.

**Architecture (as built):**
- The frontend is a **TanStack Start SSR app**, not a static site. It has no `index.html`; it runs as its own Node process.
- `dignity-frontend.service` (systemd) runs `node /srv/dignity-frontend/server/index.mjs` on **port 3001**
- Payload backend continues on **port 3000**
- nginx routes: `/admin`, `/api`, `/_next` → port 3000 (Payload); everything else `/` → port 3001 (frontend)
- Shared proxy headers factored into `/etc/nginx/proxy_common.conf`
- Previous nginx.conf backed up as `/etc/nginx/nginx.conf.bak.<timestamp>`

**Verified live:** frontend `200`, `/admin` `200`, `/api/users/me` `200`.

**Key correction:** Oracle Linux nginx reads `/etc/nginx/nginx.conf` directly — there is no `sites-available`/`sites-enabled`, and `/etc/nginx/conf.d/` was empty. The Debian-style config in the earlier version of this document would not have worked.

**API URL fixed and redeployed.** The first build baked in `VITE_PAYLOAD_URL=http://localhost:3000`, which would have broken browser-side fetches for visitors. `.env` corrected to `https://84-13-77-162.sslip.io`, rebuilt, redeployed.

**End-to-end verified in browser:**
- Homepage renders fully (Arabic, nav, hero, imagery)
- `/about/participants` renders the participant list
- `/api/participants` returns **12 real records from MongoDB Atlas** — confirming live CMS data, not the hardcoded fallback

`VITE_PAYLOAD_URL` is a build-time value. Any future rebuild must have it set correctly in `.env` *before* `npm run build`, or the site silently falls back to broken browser fetches.

**Redeploy procedure (repeatable):** build locally → `Compress-Archive` → upload to Cloud Shell → `scp` to `/tmp/fe-new` → move to `/srv/dignity-frontend` → `systemctl restart dignity-frontend`.

---

## Earlier notes (2026-08-09)

**COMPLETED:**
- ✓ Built frontend locally (`npm run build`) → `.output/` folder ready
- ✓ Compressed frontend to `frontend.zip` (158 MB)
- ✓ Uploaded `frontend.zip` to OCI Cloud Shell home directory
- ✓ Extracted `.output/` folder in Cloud Shell to `/tmp/dignity-frontend`

**MANUAL COMPLETION REQUIRED:**
The `.output` folder is extracted in Cloud Shell at `~/.output/`. You need to SSH into the Oracle instance (dignity-prod, 84.13.77.162) and run these commands as the ubuntu user:

```bash
# Copy the frontend files to /srv
sudo cp -r ~/frontend-extracted/.output /srv/dignity-frontend
sudo chown -R www-data:www-data /srv/dignity-frontend

# Configure nginx (paste the full block below)
sudo tee /etc/nginx/sites-available/dignity > /dev/null <<'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name 84-13-77-162.sslip.io;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 84-13-77-162.sslip.io;
    ssl_certificate /etc/letsencrypt/live/84-13-77-162.sslip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/84-13-77-162.sslip.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    location /admin {
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
    location / {
        root /srv/dignity-frontend;
        try_files $uri $uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    location ~ /\. {
        deny all;
    }
}
NGINX_EOF

# Enable and reload nginx
sudo ln -sf /etc/nginx/sites-available/dignity /etc/nginx/sites-enabled/dignity
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "✓ Frontend deployed!"
```

## Next Steps (after SSH into Oracle instance)

1. **SSH into the instance** — you'll need to find a way to SSH (the key in Cloud Shell didn't work, might need to create a new one or use Instance Console)
2. **Run the nginx config commands above** to serve the frontend at `/srv/dignity-frontend`
3. **Set Asil's password** (2 min). Log in as Tala at https://84-13-77-162.sslip.io/admin, Users → ahousin@birzeit.edu → Change Password → enter it twice → Save.
4. **Change Tala's temporary password** (1 min). Under Account settings once logged in.
5. **Test end-to-end with a real upload** (5 min). Log in, upload one image/PDF, confirm it persists and shows on the live site.
6. *(Optional)* Set up certificate auto-renewal so HTTPS never lapses. (2 min, worth doing.)
7. *(Pending)* Commit the `admin.position` build fix to GitHub (it's server-only now, will cause fresh clones to fail).

---

## Time Logged
- **2026-08-08:** 8 hours (Oracle deployment + HTTPS login fix)
- **2026-08-09:** 0 hours so far (starting fresh)

**Total project time to date:** ~72 hours (accumulated since start of Dignity project).
