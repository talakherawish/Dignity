# Dignity Initiative — Project Instructions

Bilingual (English/Arabic) academic website for the Dignity Initiative at Birzeit University.
Tala is the sole developer. Content is entered by hand through the Payload admin panel.

---

## Where everything actually lives

Everything runs on **one Oracle Cloud instance**: `dignity-prod`, `84.13.77.162`, Oracle Linux 9, ARM (aarch64), Always Free tier.

| Piece | Where | Port | Managed by |
|---|---|---|---|
| Payload CMS (backend) | `/home/opc/app/dignity-backend` | 3000 | **pm2** as `dignity-backend` |
| Website (TanStack Start SSR) | `/srv/dignity-frontend` | 3001 | **systemd** as `dignity-frontend` |
| nginx | `/etc/nginx/nginx.conf` | 80/443 | systemd |
| Database | MongoDB **Atlas** (external) | — | Atlas |
| Uploaded PDFs/images | `/home/opc/app/public/uploads` | — | on disk |

nginx routes by path: `/admin`, `/api`, `/_next` → backend; everything else → frontend.
Live at **https://84-13-77-162.sslip.io** — site at `/`, admin at `/admin`.

**The university hosts nothing.** They only map a domain to this IP. Oracle is the permanent home, so backups, uptime and deployment are all ours.

---

## Rules that will save you an hour

**SSH is `opc@`, from OCI Cloud Shell.**
```
ssh -i ~/.ssh/dignity opc@84.13.77.162
```
Not `ubuntu@` — this is Oracle Linux. The key exists **only in Cloud Shell**; there is no SSH key on Tala's laptop, so `scp`/`ssh` from PowerShell will not work.

**Claude's sandbox has no raw TCP.** It cannot SSH or reach `api.github.com`. All server work goes through commands Tala pastes into Cloud Shell. Give her one block at a time.

**Never paste a heredoc inside an interactive SSH session** — bracketed-paste markers (`^[[200~`) corrupt it. Use `ssh ... 'bash -s' <<'REMOTE'` from Cloud Shell instead. Keep blocks short; long nested ones get truncated mid-paste.

**Never Ctrl-C a running remote command.** It kills the local end and orphans the process on the server, leaving lock files behind. Wait, or stop it properly server-side.

**`cmd | tail -n` prints nothing until the command exits.** This repeatedly looks like a hang. Redirect to a file and poll it instead.

**Tala's VS Code terminal runs git normally.** Commits and pushes work there — only the sandbox can't reach GitHub.

---

## Deploying

**Pushing to GitHub deploys nothing.** There is no CI. A deploy is a deliberate act.

There is a tested script at `/usr/local/bin/deploy` on the server (verified on a repeat run, 2026-08-11):
```
ssh -i ~/.ssh/dignity opc@84.13.77.162 '/usr/local/bin/deploy'
```
It pulls, builds both halves, copies the frontend into place, restarts both services, and checks the endpoints. Builds run **before** anything is restarted, so a failed build leaves the live site untouched. The previous frontend is kept at `/srv/dignity-frontend.old` for rollback.

It runs `git reset --hard origin/main`, so **anything edited directly on the server is wiped**. All changes go through GitHub. That is deliberate — the server and repo silently drifted apart before this existed.

**`VITE_PAYLOAD_URL` is baked in at build time.** It must be `https://84-13-77-162.sslip.io` in the repo-root `.env` before building. If it's wrong, pages render fine for you and silently fail for visitors — this bug has already shipped once.

---

## Before committing

Staging everything at once is dangerous in this repo. Two files sit in the project root:

- **`dignity_key`** — an SSH **private key**
- **`frontend.zip`** — ~158MB, over GitHub's 100MB limit

Both are now in `.gitignore`. Verify before staging:
```
git check-ignore -v dignity_key frontend.zip
```
`dignity-backend/.env` holds the database credentials, `PAYLOAD_SECRET` and a `GITHUB_TOKEN`. It is correctly ignored — keep it that way.

---

## Backups

`dignity-backup.timer` runs nightly at 02:00, writing one archive to `/home/opc/backups` containing **both** the Mongo dump and the uploads. 14 days retained. Restore-tested, not merely assumed.

All copies live on the same instance, so they protect against mistakes but **not** against losing the machine. Copying one off-site is manual and worth doing after big content sessions.

Uploads sit *inside* the git checkout at `/home/opc/app/public/uploads`. Git does not track them, so any git command that removes untracked files would delete every uploaded PDF and image without warning. Never run a "clean untracked files" operation in `/home/opc/app`.

---

## HTTPS

Certificate for `84-13-77-162.sslip.io` renews automatically via `certbot-renew.timer` (03:00 and 15:00). Renewal briefly stops nginx — about 20 seconds, twice a year.

`--no-random-sleep-on-renew` and `TimeoutStartSec=600` in the unit are both load-bearing: certbot otherwise sleeps up to 8 minutes and systemd kills it at 90 seconds, failing silently every time.

The admin panel **only works over HTTPS on the hostname**. Plain HTTP on the bare IP drops the login cookie — that cost a full session to diagnose.

---

## Content patterns

Several pages fall back to hardcoded content when Payload returns nothing. A populated page therefore does **not** prove the CMS is working — check the API directly:
```
curl -sk 'https://84-13-77-162.sslip.io/api/participants?limit=3'
```

All collections are wrapped in `enforceBilingual()`: every English/Arabic field pair must be filled before a document can be published.

Admin sidebar order comes from the `collections` array in `payload.config.ts`. Payload has no per-collection ordering setting — an `admin.position` key is **silently ignored**. Don't re-add it.

`payload-types.ts` cannot be regenerated in the sandbox; update it by hand or builds break.

---

## How to work with Tala

Explain in plain language, not jargon. She is capable and building this alone, but she is not a sysadmin — say what a thing does and why it matters, not just what to type.

**Get evidence before forming a theory.** The two worst stretches of this project were both caused by diagnosing from assumption instead of reading a log. If something looks stuck or broken, find the actual error first.

**Verify, don't assume.** A backup isn't a backup until it's been restored. A renewal isn't set up until a dry run has passed. A deploy isn't done until the endpoints return 200.

Be honest when something is wrong or when a previous answer was mistaken. Say so plainly and move on — no over-apologising.
