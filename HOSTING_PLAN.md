# Dignity Initiative — Payload Backend Hosting Plan

Written 2026-07-18. Goal: pick one host, set it up once, don't touch it again until migrating to the university's servers.

## Current confirmed state (read directly from the repo)

- Backend: `dignity-backend`, Payload 3.85.0 built on the **official Payload + Next.js 16 integration** (`@payloadcms/next`, `next build` / `next start`). Not a bare Express app.
- Database: **MongoDB Atlas**, cluster `dignity.yvdfscd.mongodb.net`, already live, untouched by the Railway deletion. Keep as-is — no migration needed.
- File uploads: `Media.ts` has `upload: true` with no storage adapter, so files write to local disk. This works only on a host with a real persistent disk. On any serverless or ephemeral-disk host, this **must** be replaced with a cloud storage plugin or uploads silently disappear.
- Frontend: Vite/React app already deployed on Vercel (`dignity-six.vercel.app`), `.env` currently points `VITE_PAYLOAD_URL` at a dead Render URL — needs updating once the real backend is live.

## Options evaluated

| Host | Free tier reality (checked today) | Verdict |
|---|---|---|
| **Railway** | Trial-based, already expired and deleted your project once. Same risk recurs. | Ruled out — this is the exact failure we're trying to stop repeating. |
| **Render (free web service)** | No card needed, but filesystem is fully ephemeral (uploads lost on every restart/redeploy — confirmed in Render's own docs), 512MB RAM is tight for a Next.js+Payload build, and it spins down after 15 min idle (~1 min cold start). | Ruled out — needs the same storage-plugin fix as Vercel, but with worse RAM headroom and a slower cold start. |
| **Fly.io** | No permanent free tier anymore (removed 2024). New signups get 2 VM-hours or 7 days, then a card is required and you're billed. | Ruled out. |
| **Koyeb** | Free instance exists (512MB RAM/0.1vCPU, no volumes, scales to zero after 1hr idle) — but Koyeb was acquired by Mistral AI and **new users can no longer sign up for the free/Starter tier** as of this year. | Ruled out — same "rug pull" pattern as Railway; can't rely on a tier we may not even be able to activate. |
| **Northflank** | Free sandbox with "always-on compute," 2 services, 1 DB — but explicitly marketed as "not for production," resource limits undocumented, less community track record with Payload specifically. | Backup option only, not primary. |
| **Oracle Cloud "Always Free" VPS + Docker/Coolify** | Genuinely permanent free tier, real persistent disk (2 OCPU / 12GB RAM as of a June 2026 cut, still generous), no cold starts, no spin-down — this is the architecture Payload actually wants (a normal long-running Node process). | Technically the strongest option, but: requires a card for identity verification (not charged, but you'd said no-card earlier), meaningfully more setup (provisioning a VM, Docker, SSL, deploys by hand or via Coolify), and Oracle has a known reputation for free-tier capacity shortages and occasional account flags. Noted below as the option if you ever want zero platform quirks — not recommended for tonight given the "finish the project, don't reconfigure again" goal. |
| **Vercel** | Real, permanent free Hobby tier (not a trial) — 2GB RAM / 1vCPU per function, 100GB bandwidth, 100k invocations/month, no card required. Hobby plan explicitly allows non-commercial nonprofit use with no paid staff, which fits this project. You already have an account and a project here. | **Recommended.** |

## Recommendation: Vercel (backend) + Vercel Blob (storage) + existing MongoDB Atlas

Reasoning, in order of what mattered most to you:

1. **Won't get pulled out from under you.** Vercel's Hobby tier is a standing free tier used by millions of projects, not a time-boxed trial — this directly avoids the Railway/Koyeb failure mode.
2. **Matches your actual codebase.** `dignity-backend` is already built on the exact architecture (`@payloadcms/next`) that Vercel's official one-click Payload template expects. This is a supported path, not a workaround.
3. **One ecosystem, one login.** Frontend, backend, and file storage all live under the same Vercel account/dashboard — fewer accounts to manage, fewer places for env vars to drift.
4. **Storage plugin is a first-party Payload package.** `@payloadcms/storage-vercel-blob` is maintained by the Payload team specifically for this combination — not a community workaround. 1GB free storage / 10GB transfer per month, no separate signup, no auto-pause (unlike Supabase, whose free projects pause after 7 days of no DB activity — a "fix it again" risk we're specifically avoiding).

### Known trade-offs (accepted, not blockers for your usage pattern)

- **Cold starts:** first admin-panel load after idle takes a couple seconds to wake the function. Not the ~1 minute Render's free tier would cost you.
- **10-second function timeout on Hobby:** fine for normal content edits; could matter for a very large bulk import — not something you do regularly.
- **4.5MB default upload limit** via the server route — needs `clientUploads: true` in the storage plugin config so uploads go straight from the browser to Blob storage, bypassing that limit. Relevant since some of your PDFs (labor posters/reports) are likely bigger than 4.5MB.

## The plan, step by step (for tonight)

1. **Add the storage plugin.** In `dignity-backend`: `npm i @payloadcms/storage-vercel-blob`, wire it into `payload.config.ts` for the `media` collection, set `clientUploads: true`.
2. **Create a new Vercel project** for `dignity-backend` (separate project from the frontend, same account) — connect it to the GitHub repo.
3. **Enable Vercel Blob** on that project (Storage tab → Create Blob store). Vercel sets `BLOB_READ_WRITE_TOKEN` automatically.
4. **Set env vars on the new Vercel project:** `DATABASE_URL` (existing Mongo Atlas string), `PAYLOAD_SECRET` (existing value), `CORS_ORIGINS`/CSRF list including the new Vercel backend domain + the Vercel frontend domain + localhost (per the CSRF lesson from the Railway setup).
5. **Deploy**, confirm `/admin` loads and you can log in.
6. **Update the frontend's `.env`** (`VITE_PAYLOAD_URL`) to point at the new backend's Vercel URL, redeploy frontend.
7. **Smoke test:** log into `/admin`, upload one image/PDF, confirm it renders on the live site and the file persists after a few minutes (i.e., isn't silently dropped).

Not doing tonight unless you want to: custom domain for the backend (nice-to-have, not required for function).
