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
Not `ubuntu@` — this is Oracle Linux. Cloud Shell is where server work happens.

A copy of the key does exist on the laptop, at `~/.ssh/dignity` (`C:Users	ala.sshdignity`). It sat in the project root as `dignity_key` until 2026-09-22 and was moved out: gitignored or not, a private key inside the folder you zip, copy and share is one accident from being handed to someone. A third copy is the `DEPLOY_SSH_KEY` secret the deploy workflow uses. Delete the laptop copy once you have confirmed Cloud Shell still has the key — nothing here needs it.

**Claude's sandbox does have outbound HTTPS** — verified 2026-09-22: it reached `api.github.com`, `https://84-13-77-162.sslip.io` and pushed to GitHub in one session. This file used to say it had no raw TCP at all and that every server command had to be pasted into Cloud Shell by hand; that is no longer true for anything over HTTPS, so Claude can check a deploy, read the live API and push without help.

**Whether it can SSH is untested.** Assume not, and remember the key lives **only in Cloud Shell** anyway. Anything that genuinely needs a shell on the box still goes through Cloud Shell — one block at a time — but that is now the rare case, not the default.

**Never paste a heredoc inside an interactive SSH session** — bracketed-paste markers (`^[[200~`) corrupt it. Use `ssh ... 'bash -s' <<'REMOTE'` from Cloud Shell instead. Keep blocks short; long nested ones get truncated mid-paste.

**Never Ctrl-C a running remote command.** It kills the local end and orphans the process on the server, leaving lock files behind. Wait, or stop it properly server-side.

**`cmd | tail -n` prints nothing until the command exits.** This repeatedly looks like a hang. Redirect to a file and poll it instead.

**Tala's VS Code terminal runs git normally.** So does the sandbox — see above.

---

## Deploying

**Pushing to `main` deploys.** `.github/workflows/deploy.yml` (added 2026-08-11, after the rest of this file was written) SSHes into the server and runs `/usr/local/bin/deploy` on every push. This file said the opposite for over a year — that there was no CI and a deploy was a deliberate act — which was true when it was written and stopped being true the same evening.

So: a push is a deploy. There is nothing else to do, and nothing to paste into Cloud Shell.

**Check that it worked rather than assuming.** The run shows up under the repo's Actions tab, or:
```
curl -s 'https://api.github.com/repos/talakherawish/Dignity/actions/runs?per_page=3'
```
Green is not the whole story — the endpoints are. A deploy is done when `/`, `/admin` and `/api/forums` all return 200.

**Re-running without a new commit:** the workflow has `workflow_dispatch`, so it can be re-run from the Actions tab. No empty commit needed.

**Two deploys never overlap.** `concurrency: group: deploy, cancel-in-progress: false` queues them instead of cancelling, so the last push is always the one that ships. The server builds in place and swaps the frontend directory at the end; two runs would fight over it.

**The manual path still works** and is the fallback if Actions is down or the key is rotated — from Cloud Shell, not from the laptop:
```
ssh -i ~/.ssh/dignity opc@84.13.77.162 '/usr/local/bin/deploy'
```

### What the script does

It pulls, builds both halves, copies the frontend into place, restarts both services, and checks the endpoints. Builds run **before** anything is restarted, so a failed build leaves the live site untouched. The previous frontend is kept at `/srv/dignity-frontend.old` for rollback.

It runs `git reset --hard origin/main`, so **anything edited directly on the server is wiped**. All changes go through GitHub. That is deliberate — the server and repo silently drifted apart before this existed.

**`VITE_PAYLOAD_URL` is baked in at build time.** It must be `https://84-13-77-162.sslip.io` in the repo-root `.env` **on the server**, which is where the build actually happens. The workflow deliberately has no build step of its own for exactly this reason: building in CI would bake in whatever that runner's environment held instead. If it's wrong, pages render fine for you and silently fail for visitors — this bug has already shipped once.

---

## Before committing

The project root used to hold two things that must never be staged — `dignity_key` (an SSH private key) and `frontend.zip` (~158MB, over GitHub's 100MB limit). Both were removed on 2026-09-22: the key moved to `~/.ssh/dignity` (see above) and the zip deleted, along with an empty `frontend.tar.gz`. The `.gitignore` rules covering them stay, so a stray copy is still caught:
```
git check-ignore -v dignity_key frontend.zip
```
`dist/` and `.output/` are build output and are not tracked either.

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

All collections are wrapped in `enforceBilingual()`, but it does less than this file used to claim. It mirrors `required` from an English field onto its `...Ar` sibling — **titles only**, since titles are the one pair collections mark required. Every other pair is independent: a document may carry an English-only write-up, an Arabic-only caption, or both, and publish fine. Forcing both sides meant a half-translated entry couldn't be saved at all; the frontend now tells a reader when the field they're looking at doesn't exist in their language (`TranslationNotice`, `resolveAttachment`) instead. See `dignity-backend/src/lib/bilingual.ts`, which explains it at the top.

One consequence worth knowing: marking any new English field `required` silently makes its Arabic half required too — including inside an array. A Forum's attached files work this way, so a file needs both names before the forum will save.

Admin sidebar order comes from the `collections` array in `payload.config.ts`. Payload has no per-collection ordering setting — an `admin.position` key is **silently ignored**. Don't re-add it.

`payload-types.ts` cannot be regenerated in the sandbox; update it by hand or builds break.

---

## How to work with Tala

Explain in plain language, not jargon. She is capable and building this alone, but she is not a sysadmin — say what a thing does and why it matters, not just what to type.

**Get evidence before forming a theory.** The two worst stretches of this project were both caused by diagnosing from assumption instead of reading a log. If something looks stuck or broken, find the actual error first.

**Verify, don't assume.** A backup isn't a backup until it's been restored. A renewal isn't set up until a dry run has passed. A deploy isn't done until the endpoints return 200.

Be honest when something is wrong or when a previous answer was mistaken. Say so plainly and move on — no over-apologising.
