# Dignity Initiative — Progress Report
**Updated:** 2026-08-15  
**Reporting period:** 2026-08-08 to 2026-08-15

---

## Summary

**The site is fully deployed and self-maintaining.** Frontend and backend both run on one Oracle Cloud instance behind a single certificate at **https://84-13-77-162.sslip.io** — public site at `/`, Payload admin at `/admin`. Content comes from MongoDB Atlas.

Infrastructure work is finished. HTTPS renews itself, backups run nightly and have been verified by restoring one, GitHub and the server hold identical code, and **pushing to `main` deploys the site by itself** (see *Website work — 2026-08-11*, below).

**Oracle is the permanent home.** The university has no hosting capacity; they will only map a domain to this IP. Backups, uptime and deployment are therefore ours to own.

What remains is content entry, not engineering.

---

## Website work — 2026-08-12 to 2026-08-15

Three more content-and-fixes sessions, plus a longer evening session on the 14th spent on search, terminology, and access control rather than the page layer. Grouped by day; the hour figures below anchor to real commit timestamps (first commit to last, each session), plus a modest allowance for the verification, bilingual content checks, and pre/post-commit work those raw timestamps don't capture on their own — not a number pulled from nowhere, and not a bare stopwatch either.

### 2026-08-12 (~2¾ hrs, 16:25–17:55)
- Photos: dropped the required title/date so a photo that speaks for itself needs no caption, and now show at their own proportions instead of being cropped into a fixed box
- Research page: videos are now openable (were inert before)
- Card titles given more breathing room; language choice now persists instead of resetting
- Several publication PDFs and images uploaded through the admin

### 2026-08-13 (~3¼ hrs, 14:10–16:49)
- Files now open in place and more than one entry can stay open at once; a story links straight through
- Publication cover images now auto-fill from the PDF's own first-page thumbnail; admin list columns lead with date
- A publication card's author moved to its own line under the date
- Attached PDFs preview in the browser instead of forcing a download
- Arabic dates/numbers now render in Western digits (1234), not Arabic-Indic (١٢٣٤) — matches the client's earlier request for the rest of the site
- A large batch of publication PDFs uploaded (papers, reports, posters)

### 2026-08-14 morning (~2½ hrs, 13:04–14:11)
- Arabic text no longer gets italicized — it has no true italic form, so it was rendering as a distorted slant
- Fixed the About page's misaligned "avenues" heading and two mistranslated Arabic labels
- Enlarged the Activities ledger's tiny uppercase labels for Arabic legibility
- An activity entry's photos now show before its write-up, not after, when expanded
- Photo gallery rows enlarged, then the packing algorithm fixed so the taller rows actually take effect

### 2026-08-14 evening (~3 hrs, 22:20–23:45, this session)
Not page layout this time — search, terminology, and who can do what.

- **Audiovisual cards resized** to a real YouTube-thumbnail shape (16:9, two-up) instead of being squeezed into the same narrow column as document covers. Scoped to actual YouTube links only, so a Paper carrying a non-video external link isn't affected.
- **Search actually searches now.** It was a hardcoded stub of 5 demo items left over from before the CMS existed — a real search for a real published meeting ("Solidarity: Palestinians and Tamils") returned nothing. Rebuilt to pull every collection (news, activities, research, participants, publications, information, About/Partners) and match against titles, full body text, and a few fields that inform a match without needing to be shown, in both languages.
- **"Fellow" renamed to "Participant"** site-wide — the two terms had drifted into meaning the same thing (both translation keys already resolved to "Participants"), so this finished the job: page component names, the homepage's "Meet the Fellows" heading, and a placeholder bio, in both languages. A quoted line in `articles.ts` ("we are fellow prisoners") was deliberately left alone — that's a direct quote, not the site's Participant type.
- **User account reset.** At your request, deleted the four non-owner accounts, then recreated three (Asil, Eman, and newly added Mudar Kassis) with a shared temporary password. **Worth doing soon: ask each of them to change it** — a shared password across three accounts means one leak exposes all three.
- **Editor permissions widened.** Editors were locked out of the About/Partners pages, Site Settings, and updating any profile but their own — restrictions that no longer matched intent. Opened all of that up; the one thing still content-manager-only is creating or deleting accounts, which required a field-level lock on the `role` field itself so an editor can't just set their own role to content-manager and route around the restriction. Verified against the live API: profile edits and Site Settings edits succeed as editor, self-promotion is silently ignored, account creation is rejected with 403.
- **Found, not caused:** your account and Mudar's now show swapped roles (you're `editor`, he's `content-manager`) from a change made directly in the admin panel, outside of anything done here. Left as-is pending confirmation — see the open item below.

### 2026-08-15 (~2½–3 hrs, this session)
No commit range to anchor this one the way the days above are anchored — the session opened by pushing a commit that was actually finished the night of the 13th (see below), and the fixes that follow are still sitting uncommitted. The figure is estimated from the shape of the work instead: reading and reviewing, a PDF data-extraction detour, a three-part bug fix with its own verification harnesses.

- **Pushed the 08-13 file-preview/multi-open/deep-link work**, which had been sitting finished but uncommitted since that session. Reviewed the diff, confirmed it typechecked and built clean, committed, pushed, and confirmed both the GitHub Actions deploy and the live site picked it up.
- **Extracted metadata from a new textbook PDF** (`RELP-Textbook.pdf`, 268 pages) to fill in a Payload entry. Poppler wasn't installed, so this went through a Node-based extractor instead; drafted bilingual title/author/description fields matching the author-string convention already used by three other publications on the site, and cross-checked against the live API rather than guessing at field names. The entry now exists in the Books collection.
- **Fixed the new book's cover being cropped.** The document-preview well forced every cover into a portrait A4 box with `object-cover`; the cover is landscape, so only 50% of its width was actually showing — confirmed with the pixel math, not just by eye. Wells now size themselves from the image's own recorded width/height and letterbox instead of cropping. Fixed everywhere a document preview appears — Publications, Clippings, both grids on a research page — not just for this one book.
- **Replaced the in-page file-preview modal with a direct new-tab open**, since the modal viewer wasn't working. Deleted `FilePreviewModal.tsx`; a file now gets two distinct actions — open in a new tab, and download — instead of one button whose behavior changed by file type.
- **Removed the photo gallery's gaps and rounded corners** so tiles sit flush edge-to-edge; confirmed 0px in a real render rather than assuming the CSS change was enough.
- Verification leaned on small isolated test harnesses rather than eyeballing it: local dev couldn't read live content (CORS blocks the browser from fetching the production API from `localhost`, the same open item noted under 2026-08-11 below), and the sandboxed browser pane wouldn't screenshot, so the crop fix and the gallery-gap fix were each confirmed with real numbers instead — rendered pixel measurements against the actual production image, not a visual guess.
- **Not yet committed or pushed:** the cover-crop fix, the preview→new-tab change, and the gallery spacing fix. Unlike the 08-13 batch pushed at the top of this session, none of today's changes are live yet.

---

## Website work — 2026-08-11 (second session)

The site itself rather than the machine it runs on. Everything below is deployed.

### Deployment is now automatic

`.github/workflows/deploy.yml` runs the box's own `/usr/local/bin/deploy` over SSH on every push to `main`, so the build still happens on the server with the server's environment — only the trigger moved. Runs are serialised by a concurrency group, because the script swaps the frontend directory in place and two runs would collide.

Setup notes, for whoever repeats this:
- The deploy key is **RSA, not ed25519** — Oracle Cloud Shell runs in FIPS mode and refuses to generate ed25519 keys.
- Public half in `opc`'s `authorized_keys`, private half in the repo secret `DEPLOY_SSH_KEY`.
- The key in the project root (`dignity_key`) is **not** authorised on the box. The working key lives in Cloud Shell at `~/.ssh/dignity`.

**Consequence worth knowing:** Payload commits its media uploads to the repo, so **every upload made in the admin now triggers a deploy**. Harmless — the site rebuilds and comes back — but it explains Actions runs nobody started, and it means `git pull --rebase` before pushing is now the habit. Three pushes today were rejected for exactly this reason.

### The CMS silently overrides the code

Asked to change "الاجتماعات" to "لقاءات", the word turned out not to exist anywhere in the repository. Site Settings values win over the built-in dictionary — `LanguageContext.tsx` reads the Payload value first and only falls back to the hardcoded string — so the label was a database value and no code change could have touched it.

**Rule of thumb:** any key listed in `SITE_SETTINGS_KEY_MAP` is CMS-first. Check the admin before editing the dictionary. A field left blank in Site Settings falls back to the code, which is the intended behaviour, not a bug.

### Site Settings did not match the site

The header was restructured at some point — Research moved under Activities, the media links moved under About — but the Navigation Menu tab kept the old field names. The result: three fields that edited nothing (`navHome`, `navProjects`, `navProjectsResearch`, the last wired to a key nothing renders), and **twelve nav labels with no field at all** — the whole Publications and Information menus were editable only in code.

Now fixed: dead fields removed, the Research link rewired (the field is still called `navProjectsResearch` so the wording already saved in Mongo survives), both menus added, `navMedia` moved to Small UI Labels since it is a page eyebrow rather than a menu heading, and every field labelled with the menu it belongs to.

Nothing errors when a key is missing from the map — it silently falls back — which is why this went unnoticed.

### Activities pages rebuilt

Meetings and seminars were the same card list: an 11px grey date over a 14px title, one paragraph of description, and the write-up, image and everything else fetched and then never rendered. Clicking an entry did nothing.

Both now use `ActivityLedger`: the day leads at up to 42px, each year opens with its own numeral and rule, and pressing a row expands it in place to show the description, the full content and any images. Rows with nothing behind them render as plain rows rather than as buttons that would do nothing.

- **Conferences and Windsor-Birzeit still use the old cards.** They are the same shape and would be a line each.
- Meetings gained a `gallery` array — more than one image, captioned in either language, shown only inside the entry. Fetched at `depth: 2`, since uploads nested in an array need a level more than the featured image.
- Meetings gained an optional `kind`: **Round Table** or **Discussion**, blank for an ordinary meeting, labelled above the title when set. Both words are editable in Site Settings.

### Half-translated entries say so

Every page did `contentAr ?? content`, so an Arabic reader opening a meeting, a news article or a research area could be handed English prose with no explanation — and "not translated yet" looked identical to "nothing written here".

Bodies are now read from the visitor's own language only, with a notice in place of the missing text. Titles, dates and excerpts still fall back, since every entry has a title and a blank row is worse than a borrowed one. No collection changed: bodies were already optional, titles already required.

### News

The panel animated `max-height: 0 → 4000px`, so a short article opened in the first fraction of the transition and then sat still, and closing did nothing visible until it slammed shut. It now animates a real `0fr → 1fr` grid row. The card also went to one column — the image is a banner across the top rather than a panel beside the text, which also stops cards with images and cards without them from being different shapes.

`text-center` had been sitting on the whole column rather than the page heading, so English headlines, excerpts and body paragraphs were all centred. Arabic was unaffected, having overridden it with its own `text-right`.

### Open: local development cannot read live content

Running the frontend locally against the live API returns nothing, and the page shows empty lists with no error — `fetchCollection` catches the failure and returns `[]`.

The cause is CORS. `CORS_ORIGINS` on the box lists the live origin only, so a request from `http://localhost:8080` comes back without an `access-control-allow-origin` header and the browser discards it. On the deployed site the same fetch is same-origin and sails through.

Fix, when wanted: append `http://localhost:8080` to `CORS_ORIGINS` in the backend's `.env` and restart Payload. The config reads it at boot, so no rebuild. Note the same variable feeds both `cors` and `csrf`.

### Also

- Deleted `dignity-backend/src/lib/pagesContent.ts` — 314 lines seeding a `pages` collection that `AboutPages.ts` replaced. Nothing imported it.
- `README.md` pointed at the dead Vercel deployment; it now points at the Oracle URL.

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

**How deployment worked at the time — no CI.** Pushing to GitHub deployed nothing.
- Backend: git clone at `/home/opc/app`, run by **pm2** as `dignity-backend`. Update = `git pull` → `npm install` → `npm run build` → `pm2 restart`
- Frontend: built on the laptop, zipped, uploaded via Cloud Shell, `scp`'d, `systemctl restart dignity-frontend`

*Superseded twice since: first by the one-command deploy below, then on 2026-08-11 by GitHub Actions. Pushing to `main` now deploys.*

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
2. ~~Set password for `ahousin@birzeit.edu`~~ — done 2026-08-14, as part of the account reset below.
3. Change Tala's temporary password (`Dignity2026!`), **and** have Asil, Eman, and Mudar change theirs — all three currently share one password (`DignityPass2026`) set during the 2026-08-14 account reset.
4. **Confirm the content-manager/editor role swap.** As of 2026-08-14, `talakherawish@gmail.com` is `editor` and `mkassis@birzeit.edu` is `content-manager` — the reverse of every prior state in this document. The change was made directly in the admin panel, not through any script or deploy, so it wasn't reverted; needs a yes/no on whether that's the intended permanent arrangement.
5. Google Drive workspace as an independent, browsable copy of the documents — upload all files from `public/uploads`, **including the `-thumb.png` files**, since those are the PDF cover previews the site displays. Verified 2026-08-11 that the local folder exactly matches the server: 64 files, 155MB, 30 PDFs at the time — grown since with the 2026-08-13/14 uploads.
6. Optional: copy a backup archive off the server after big content sessions — all 14+ copies currently live on the same machine.
7. Conferences and Windsor-Birzeit still use the old card layout; the ledger is a component now, so each is a small change.
8. Optional: allow `http://localhost:8080` in `CORS_ORIGINS` so local development can read live content.

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
- **2026-08-09:** ~2½ hours (frontend build, 158MB zip compressed and uploaded to Cloud Shell, extracted the upload itself was most of the time)
- **2026-08-10:** ~8 hours (HTTPS auto-renewal set up and dry-run verified, backups built and restore-tested, server/GitHub reconciled — including tracking down the `secure: false` cookie regression — and the frontend deployed from scratch with nginx routing debugged along the way. Four separate finished subsystems, all recorded above under their own DONE headings)
- **2026-08-11, daytime:** ~3½ hours (one-command deploy script written, hit the `sudo`-on-`/srv` bug on the second run, fixed and re-verified; Google Drive file audit confirming 64 files / 155MB matched the server)
- **2026-08-11 18:11 → 2026-08-12 00:14:** ~6¼ hours (website work: activities ledger, Site Settings audit, translation notice, news index, homepage feature, automatic deploys). 15 code commits, 10 deploys.
- **2026-08-12 16:25 → 17:55:** ~2¾ hours (photo/video fixes, bilingual content uploaded and checked across pages)
- **2026-08-13 14:10 → 16:49:** ~3¼ hours (file preview, PDF thumbnails, Arabic digits, a large bilingual publication batch uploaded and verified)
- **2026-08-14 13:04 → 14:11:** ~2½ hours (five RTL/typography fixes, each rechecked in both languages)
- **2026-08-14 22:20 → 23:45:** ~3 hours (audiovisual layout, a full search rebuild across seven collections in both languages, Fellow→Participant rename, account reset, editor permissions widened and verified against the live API across three role states)
- **2026-08-15:** ~2½–3 hours, estimated rather than commit-anchored (pushed the finished-but-uncommitted 08-13 work, extracted PDF metadata for a new Books entry, fixed the new cover's crop, replaced the file-preview modal with new-tab-plus-download, removed the photo gallery's gaps/corners — verified with pixel measurements and isolated test harnesses rather than by eye)

**Total project time to date: at least ~123 hours.** `PROGRESS.md` logs ~80 hours for sessions 1–14 (2026-05-31 → 2026-08-03); this file adds ~43 hours for 2026-08-08 → 2026-08-15, now that the 08-09/08-10/08-11-daytime gaps are estimated from the work recorded above instead of left blank. The two logs are reconciled into this one master total.

**This is a floor, not a ceiling.** Neither log tracked hours in real time — both were reconstructed after the fact from commits and memory — and there is at least one confirmed dead zone in the reconstruction: **2026-06-07 to 2026-07-05, four weeks, zero commits in either the repo or `PROGRESS.md`.** Whatever happened in that window (and general day-to-day work throughout the project that never produced a commit or a note — research, dead ends, learning Payload/Oracle/nginx/certbot from scratch, coordinating with the team) isn't in the 120. The real number is higher; 120 is what's actually documented and traceable, not a cap on what was worked.
