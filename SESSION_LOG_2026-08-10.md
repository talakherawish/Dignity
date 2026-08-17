# Session Log — 2026-08-10 → 2026-08-11

Detailed record of a single working session. Times are anchored to timestamps that appeared in terminal output where available; stage durations are estimated from the sequence of work and flagged as such.

**Anchors (from actual output):**
- Session start: ~13:23 (first file write of the day)
- Frontend build on laptop: 14:01
- Cloud Shell file upload complete: 16:55
- Frontend service first live on :3001: 17:20
- First backup archive created: 21:01
- Deploy script test runs: 04:40 and 04:54 (server time, next morning)

**Total elapsed: roughly 12–15 hours**, including waiting, dead ends, and one long stretch that produced nothing.

---

## 1. Recovering context and refreshing the progress report
**~30 min**

Read back the previous session's transcript to reconstruct where things stood, then wrote a progress report covering the Oracle backend deployment and the HTTPS login fix.

Outcome: written record of state. No infrastructure change.

---

## 2. Oracle database question — investigated, then dropped
**~20 min**

Asked whether Oracle provides a database. Established that Oracle offers Autonomous Database and NoSQL, but **Payload supports only MongoDB, Postgres and SQLite — there is no Oracle adapter**. So "move the database to Oracle" was never actually on the table; the only real option would have been self-hosting MongoDB on the instance.

Decision at this point: skip it, do something else.

Outcome: a real constraint identified. Prevented a migration attempt that could not have worked.

---

## 3. Deciding to move the frontend onto Oracle
**~15 min**

Goal clarified: both frontend and backend on Oracle, under one address, database staying put for now. Chose **same domain with path-based routing** over subdomains — one certificate, one IP, simpler for the university.

---

## 4. Getting the frontend built and onto the server
**~2 hours 45 min (14:01 → 16:55, mostly friction)**

This stage took far longer than the work in it warranted.

- Sandbox build failed — missing native rollup binary; `npm install` then timed out at 120s
- Attempted to build on the laptop via the sandbox — no access to local PowerShell
- Attempted computer-use control of Terminal — granted only "click" tier, no typing
- Attempted File Explorer access — request timed out after 180s
- **Build eventually run by Tala directly in PowerShell** — succeeded in 44s
- `tar` failed on the `.output` folder (leading-dot path handling on Windows); `Compress-Archive` worked
- Uploaded 158MB zip through Cloud Shell's upload dialog

**Wasted effort in this stage:** roughly 45 minutes of it was me trying to drive the build through tooling that couldn't do it, when asking directly would have taken two minutes.

---

## 5. The SSH dead end
**~1 hour, produced nothing**

Repeatedly failed to connect to the server, concluded the SSH key was unauthorised, and proposed regenerating keys, rebooting the instance, and using the OCI CLI (twice hitting commands that don't exist in that CLI version).

**The key was fine. The username was wrong** — the box is Oracle Linux, so the user is `opc@`, not `ubuntu@`. Tala had to point out we had already done this together the day before.

Cost: about an hour, and understandable frustration. Root cause: diagnosing from assumption instead of checking the prior session's working command.

Now recorded in memory so it cannot repeat.

---

## 6. Frontend deployed — and a wrong assumption caught in time
**~45 min (17:20 live)**

Before writing any config, checked what was actually there. Two things would have caused damage:

- **The frontend is an SSR app, not a static site.** No `index.html`; it needs its own Node process. The static-file config drafted earlier would not have worked.
- **Oracle Linux nginx has no `sites-available`/`sites-enabled`.** Config lives directly in `nginx.conf`, and an existing working HTTPS block was already there. The Debian-style config would have **overwritten it and taken the backend offline.**

Built instead:
- `dignity-frontend.service` (systemd) running the SSR app on port 3001
- nginx upstreams `be`(3000) and `fe`(3001); `/admin`, `/api`, `/_next` → backend, everything else → frontend
- Shared proxy headers factored into `/etc/nginx/proxy_common.conf`
- Previous config backed up first

Verified: frontend 200, admin 200, api 200.

---

## 7. Catching a bug that would have shipped broken
**~20 min**

The build had baked in `VITE_PAYLOAD_URL=http://localhost:3000`. Server-side rendering would have worked — masking the fault — while every browser-side fetch failed for real visitors.

Corrected, rebuilt, redeployed. Confirmed end-to-end: `/api/participants` returned **12 real records from Atlas**, matching what rendered on the page — proving live CMS data rather than the hardcoded fallback.

---

## 8. HTTPS auto-renewal — and a long self-inflicted detour
**~1 hour 30 min, of which ~50 min wasted**

Set up a systemd timer to renew the certificate. The dry run then appeared to hang, repeatedly.

What I did wrong, in order:
1. Blamed a webroot config I had hand-edited. Reverted it. Still hung.
2. Blamed the network. Wrong again.
3. Killed the process three times with `timeout`, each kill landing mid-sleep, twice leaving stale lock files that caused "Another instance of Certbot is already running".

**The actual cause was one line in `/var/log/letsencrypt/letsencrypt.log`:**
`Non-interactive renewal: random delay of 360.38 seconds`

Certbot deliberately sleeps up to ~8 minutes in non-interactive mode. It was working the whole time. The tell had been visible from the start — the very first run finished instantly because it lacked `--non-interactive`.

This also exposed a genuine bug in the unit I had written: systemd's default 90-second timeout would have killed every renewal for the same reason. Fixed with `--no-random-sleep-on-renew` and `TimeoutStartSec=600`.

Final state, **verified by dry run**: "all simulated renewals succeeded", nginx active afterwards, site 200.

---

## 9. Server ↔ GitHub reconciliation
**~1 hour**

Discovered they had diverged **in both directions**: the server carried uncommitted edits, GitHub carried unbuilt work. Neither was a complete copy.

Before committing, found two things that would have caused real harm:
- **`dignity_key`** — an SSH **private key** in the project root, untracked, one `git add .` from being published
- **`frontend.zip`** — 158MB, over GitHub's 100MB limit; the push would have failed partway

Both added to `.gitignore` and verified excluded before staging.

Also found and fixed a security regression: the server was running `auth: { cookies: { secure: false } }`, left over from the previous day's HTTP debugging. It marked the admin login cookie as not-Secure on an HTTPS site. Pulling restored `auth: true`.

Then: pulled, installed, rebuilt, restarted under pm2. All endpoints 200. **Research content confirmed present** — it had been missing only because the server was running older code.

Established along the way that **nothing auto-deploys**; pushing to GitHub had never done anything.

---

## 10. Backups
**~1 hour (first archive 21:01)**

Chose against storing media in the database — Payload has no supported adapter for it, and Atlas's 512MB cap would have been exceeded by the PDFs alone.

Built instead: `dignity-backup.sh` + nightly timer at 02:00, producing one archive containing both the Mongo dump and the uploads. 14 days retained.

First run: **151MB, 65 upload files**.

**Verified by restoring**, not by trusting the file size. Restored into a scratch database, which then reported `dropped: 'backuptest'` on cleanup — a database only reports as dropped if it existed, proving real data landed.

Three of my `grep` patterns failed to match during this stage and hid the answer each time, which added avoidable back-and-forth.

---

## 11. Documentation
**~40 min**

Wrote `PROJECT_INSTRUCTIONS.md` covering topology, the rules that cost time today, the deploy process, what must never be committed, and content gotchas.

Tala caught that I had written out two destructive commands verbatim in a document meant to warn against them. Rewritten to describe the danger without providing a copy-pasteable version.

---

## 12. Deploy script
**~1 hour including builds**

Decided against GitHub Actions for now — full automation on a site that changes a few times a month mostly buys the ability to break production unattended.

Built `/usr/local/bin/deploy`: pulls, builds both halves on the server, swaps the frontend in, restarts both services, checks endpoints. Builds run before any restart, so a failed build leaves the live site untouched.

**The test earned its keep.** First run passed. Second run failed: removing `/srv/dignity-frontend.old` needs `sudo`, because deleting a directory requires write permission on its parent and `/srv` is root-owned. Every run after the first would have failed — meaning the first *real* deploy, probably in a hurry, would have been the one that broke.

Fixed and re-verified on a repeat run: three 200s.

---

## 13. Database decision
**~20 min**

Decided to stay on MongoDB Atlas. Reasoning: Atlas replicates across three nodes, a single instance has one disk; the 512MB cap is irrelevant at ~100KB of text; and the nightly backup already pulls a copy onto the Oracle box.

Note: an earlier argument I gave for staying — "you'll migrate to university servers later anyway" — was **wrong**, and I retracted it once Tala explained the university hosts nothing and only maps a domain. Oracle is permanent. The decision held on the resilience argument alone.

---

## 14. Uploads verification
**~10 min**

Compared local `public/uploads` against the server: **exact match — 64 files, 155MB, 30 PDFs**, every PDF with its matching thumbnail.

Corrected my own earlier advice to skip the `-thumb.png` files: they are the PDF cover previews the site displays, not clutter. All 64 should go to Drive.

---

## Where the time actually went

| Stage | Time | Value |
|---|---|---|
| Context + progress report | ~30 min | necessary |
| Oracle DB investigation | ~20 min | prevented a dead end |
| Frontend build + transfer | ~2h 45m | ~45 min wasted on tooling |
| **SSH dead end** | **~1h** | **entirely wasted** |
| Frontend deploy + nginx | ~45 min | high — avoided taking backend down |
| API URL bug | ~20 min | high — would have shipped broken |
| **HTTPS renewal** | **~1h 30m** | **~50 min wasted** |
| Server ↔ GitHub reconciliation | ~1h | high — key exposure, security fix |
| Backups | ~1h | high |
| Documentation | ~40 min | high |
| Deploy script | ~1h | high — caught a real bug |
| DB decision + uploads check | ~30 min | necessary |

**Roughly 12–15 hours elapsed. About 2 hours of it produced nothing** — the SSH username and the certbot sleep, both caused by theorising before reading the evidence.

---

## What exists now that didn't this morning

- Frontend and backend on one instance, one domain, one certificate
- HTTPS renewing itself, verified by dry run
- Nightly backups of database and uploads, verified by restore
- GitHub and server holding identical code
- A tested one-command deploy
- Written project instructions and a documented deploy path

## Things caught that would have caused real damage

1. An SSH **private key** one `git add .` from being published
2. An nginx config that would have taken the backend offline
3. A build that rendered fine for us and was broken for every visitor
4. An insecure login cookie left over from debugging
5. A deploy script that worked once and would have failed every time after
