# Dignity Initiative Website — IT Meeting Prep

A plain-language brief so you can walk in knowing your own stack, plus the questions IT will likely ask and how to answer each one. Every fact below was read directly from your codebase, not assumed.

---

## 1. The one-paragraph summary (say this first)

"The site is two separate applications. The **public website** is a React app (built with Vite) that serves static pages to visitors. The **content management system** is a separate app — Payload CMS running on Next.js — that my team logs into to edit content; it exposes an `/admin` panel and a content API the website reads from. The **database is MongoDB** (a NoSQL document database), hosted on MongoDB Atlas in the cloud. Uploaded files (images, PDFs) are stored in a GitHub repository. All three pieces talk to each other over HTTPS."

That single paragraph answers 80% of what IT wants to know. The rest is detail.

---

## 2. Answers to your own questions

**Is the database SQL or NoSQL?**
NoSQL. It's **MongoDB** — a document database. Confirmed in the code: the backend uses `@payloadcms/db-mongodb` and the connection string starts with `mongodb+srv://`.

**Where is the database / which Google account?**
It is **not on any Google account** — that's why you couldn't find it. It lives on **MongoDB Atlas** (a cloud database service at atlas.mongodb.com), in a cluster named `dignity.yvdfscd.mongodb.net`. Before the meeting, log into atlas.mongodb.com and confirm which email you used to create it (possibly a Google sign-in, but a different service from Drive/Gmail). You need to know that login exists and who controls it.

**How does the pipeline work?**
- You edit code locally → push to **GitHub**.
- GitHub triggers an automatic build/deploy of the **backend** (Payload/Next.js) and the **frontend** (React/Vite), each currently on **Vercel**.
- The backend connects to **MongoDB Atlas** for content data.
- File uploads from the admin panel are committed into a **GitHub repo** and served from there.
- The frontend fetches content from the backend's API and renders pages for visitors.

---

## 3. The exact tech stack (your cheat sheet)

| Piece | What it is | Detail from the code |
|---|---|---|
| **Frontend framework** | React 19 + TanStack Start, bundled by Vite 7 | `dignity-academic-hub/package.json` |
| **Backend / CMS** | Payload CMS 3.85 on **Next.js 16** | `dignity-backend/package.json` |
| **Runtime** | **Node.js ≥ 20** required | `engines` in backend `package.json` |
| **Database** | **MongoDB** (NoSQL), MongoDB Atlas cloud | `@payloadcms/db-mongodb`, `mongodb+srv://` |
| **File/media storage** | Committed to a **GitHub repo**, served from raw.githubusercontent.com | custom `githubStorageAdapter` in `payload.config.ts` |
| **Image processing** | `sharp` (native library) + `pdf-to-img` for PDF thumbnails | backend dependencies |
| **Containerization** | A **Dockerfile** exists (Node 22 Alpine, standalone Next.js output, exposes port **3000**) | `dignity-backend/Dockerfile` |
| **Current hosting** | Frontend + backend on Vercel; DB on Atlas | `HOSTING_PLAN.md` |
| **Languages** | Bilingual (English + Arabic), enforced at the CMS level | `enforceBilingual` in config |

---

## 4. Questions IT will likely ask — and your answers

**"What language/runtime does it need?"**
Node.js, version 20 or higher. Both apps are JavaScript/TypeScript.

**"SQL or NoSQL? What database?"**
NoSQL — MongoDB. Currently hosted on MongoDB Atlas. Ask them: *do you want us to keep using Atlas, or do you provide a MongoDB instance on your servers?* Either works; it's just a connection-string change.

**"Can you run it in a container / do you have a Dockerfile?"**
Yes. The backend already has a working Dockerfile (Node 22 Alpine, standalone build, listens on port 3000). This is your strongest card — most university IT departments prefer a container they can drop into their own infrastructure. Lead with it.

**"What ports does it need?"**
The backend serves on port **3000** by default (configurable). The frontend is static files that can be served by any web server (Nginx, Apache) or a Node process.

**"How much memory / CPU?"**
The Next.js + Payload build is memory-hungry at **build time** — the build script sets Node's max heap to **8 GB** (`--max-old-space-size=8000`). At runtime it's much lighter. Flag this: the *build server* needs meaningful RAM (aim for 4–8 GB); the *running app* needs far less (1–2 GB is typically fine). Ask what their build/runtime resource limits are — this is exactly the "hosting limits" question you were worried about.

**"Does it need persistent disk storage?"**
Currently no — uploaded files go to GitHub, not local disk. But if they'd prefer files live on *their* storage (a mounted volume or S3-compatible bucket) instead of GitHub, that's a swappable storage adapter. Worth asking which they prefer; universities often don't want production assets sitting in an external GitHub repo.

**"How do you deploy / what's your CI/CD?"**
Currently: push to GitHub → automatic build & deploy on Vercel. On their servers this becomes: build the Docker image (or `npm install && npm run build`) → run `node server.js`. Ask if they use their own CI (GitLab CI, Jenkins, etc.) or want to pull from GitHub.

**"What environment variables/secrets does it need?"**
Four main ones (don't read the values aloud):
- `DATABASE_URL` — MongoDB connection string
- `PAYLOAD_SECRET` — signing secret for admin auth
- `CORS_ORIGINS` — the allowed frontend domain(s)
- GitHub token + repo settings (only if they keep the GitHub file-storage approach)
Ask how they want secrets managed (env vars, a vault, etc.).

**"What about SSL/HTTPS and the domain?"**
The apps expect to run behind HTTPS. You'll need: the final domain name (e.g. dignity.university.edu), an SSL certificate (they almost certainly provide this), and that domain added to `CORS_ORIGINS`. Note: the admin panel is strict about CORS/CSRF — its own domain must be in the allowed list or logins fail. Mention this so it doesn't surprise anyone.

**"Any external services it depends on?"**
MongoDB Atlas (unless they host Mongo themselves) and, currently, GitHub for file storage. No other third-party APIs.

**"Is it accessible / secure / maintained?"**
Bilingual EN/AR is built in. Auth is handled by Payload's built-in user system. Keep the answer honest and short; offer to follow up on anything specific.

---

## 5. Questions YOU should ask THEM (turn it into a two-way conversation)

1. Do you provide a **MongoDB** instance, or should we keep using MongoDB Atlas?
2. What are your **build-time and runtime resource limits** (RAM/CPU)? (Our build wants up to ~8 GB.)
3. Do you accept a **Docker container**, or do you want to build from source on your servers?
4. What's your **deployment process** — do you pull from GitHub, or use your own CI?
5. How do you want **file uploads** stored — keep GitHub, or use your storage/a bucket?
6. How are **secrets/environment variables** managed on your platform?
7. Who provides the **domain and SSL certificate**, and what's the final URL?
8. Is there **Node.js 20+** available in your environment?
9. What **support/access** will I have — can I deploy, or does your team deploy on my behalf?

---

## 6. Things to do before the meeting

- Log into **atlas.mongodb.com** and confirm the account/email that owns the database. Know who controls it.
- Confirm which **GitHub** account/repo owns the code and the uploaded files.
- Bring this document (or the key facts) so you're not answering from memory.
- Be ready to say plainly: *"I built it; I understand the pieces; I'm here to learn your constraints so I can adapt the deployment to fit them."* That framing lands well — IT respects someone who knows their stack and is flexible about hosting.

---

## 7. If you only remember five things

1. **Two apps**: a React frontend and a Payload/Next.js backend.
2. **Database is NoSQL — MongoDB** — currently on MongoDB Atlas (cloud, not Google).
3. **There's already a Dockerfile** — lead with this; it makes their life easy.
4. **Node.js 20+**, backend on **port 3000**, build wants up to **~8 GB RAM**.
5. **Files currently stored in GitHub** — ask if they'd rather host them.
