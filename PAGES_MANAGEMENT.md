# Managing Pages Content (About, Mission, Vision)

## How It Works Now

All page content is stored in **Payload's Pages collection** and displayed on the website. This includes:

- **About** page (slug: `about`) — Initiative overview, values, and avenues
- **Mission & Vision** page (slug: `mission`) — Mission statement and vision

## Getting Started (Localhost Setup)

### Step 1: Seed Initial Content

When you start the backend for the first time, run this URL in your browser to populate Payload with the default content:

```
http://localhost:3000/api/seed-pages
```

**Expected response:**
```json
{
  "success": true,
  "message": "Pages seed complete",
  "results": [
    { "slug": "about", "status": "created" },
    { "slug": "mission", "status": "created" }
  ]
}
```

This is **safe to run multiple times** — it will skip pages that already exist. If you ever want to reset content to defaults, run this again.

### Step 2: Edit Content in Payload Admin

1. Go to http://localhost:3000/admin
2. Log in with your admin account
3. Go to **About the Dignity Initiative** → **Pages**
4. Click on "about" or "mission" to edit
5. Edit the Title, Description, and full Page Content (body)
6. Each field has English and Arabic versions — they're independent, so you can edit one without the other
7. Click **Publish** when done

**Important:** The "Page Identifier" (slug) should NOT be changed — it connects to the website page.

### Step 3: Verify on Frontend

1. Start the frontend: `npm run dev` (from the main directory)
2. Visit http://localhost:8080/about
3. Your edits should appear immediately (live fetch from Payload)

## Content Structure

### About Page

| Field | Purpose | Editable |
|-------|---------|----------|
| **Title** (EN/AR) | Page heading | ✅ Yes |
| **Description** (EN/AR) | Short intro under the title | ✅ Yes |
| **Body** (EN/AR) | Full content with intro paragraphs + bullet list of avenues | ✅ Yes |

**Body format:** Starts with narrative paragraphs, ends with a lead-in phrase ("Karama realizes its goals through several avenues:") followed by a bullet list of 8 items.

### Mission Page

| Field | Purpose | Editable |
|-------|---------|----------|
| **Title** (EN/AR) | Page heading (usually "Mission & Vision") | ✅ Yes |
| **Description** (EN/AR) | Short intro | ✅ Yes |
| **Body** (EN/AR) | Two paragraphs: mission statement + vision statement | ✅ Yes |

## Bilingual Consistency

**The same content appears in both languages unless you edit them separately.** 

When editing in Payload:
- Edit the English fields → saves to English
- Edit the Arabic fields → saves to Arabic
- They're completely independent

On the frontend, the language toggle switches between EN/AR versions.

## Deployment

**Before deploying to Vercel:**

If you've edited content and want it live on Vercel:

1. All edits are automatically published when you click "Publish" in Payload
2. The live site fetches from Payload CMS automatically
3. No code changes needed — just publish in Payload and the site updates

**If new pages are added in the future:**

1. Add the new page definition to `SEED_DATA` in `dignity-backend/src/app/api/seed-pages/route.ts`
2. Run the seed route again: `http://localhost:3000/api/seed-pages` (it will create the new page)
3. Edit the new page in Payload admin
4. Wire it up in the frontend component to fetch and display it

## Troubleshooting

**Content not showing?**
- Verify the page is **Published** (not in Draft state)
- Check browser console for fetch errors
- Confirm the slug matches what the frontend is looking for

**Content reverted to old text?**
- Check if the edits were saved (look at the "Updated" timestamp in Payload)
- If missing entirely, run `/api/seed-pages` to restore defaults
- Reopen the page and re-make your edits

**Getting "Something went wrong" in Payload?**
- Check backend logs for errors
- Verify the page structure matches the schema (title, titleAr, body, bodyAr fields)

## Technical Details

### File Locations

- **Seed route**: `dignity-backend/src/app/api/seed-pages/route.ts` — Creates initial pages
- **Frontend fetch**: `src/hooks/usePage.ts` — Fetches from Payload by slug
- **Component**: `src/components/AboutMission.tsx` — Displays page content
- **Route**: `src/routes/about.tsx` — Combines About + Mission data

### How Frontend Gets Content

```
1. Route loads (about.tsx)
2. Calls usePage("about") and usePage("mission")
3. Fetches from /api/pages?where[slug][equals]=about (via src/lib/payload.ts)
4. Returns title, description, paragraphs, items
5. Component renders them
```

### Consistency Pattern

The system now follows **Option A**:
- ✅ Payload is the source of truth (always fetch first)
- ✅ Seed route provides initial defaults (from code)
- ✅ When user edits in Payload, frontend shows the edited version
- ✅ If page is missing, frontend shows empty (not fallback text)

**This means:** Whether it's a fresh deployment or an edited version, the content is **always consistent** because it always comes from the same place: Payload.

---

**Questions or issues?** Check the backend logs or review the `usePage()` hook in `src/hooks/usePage.ts`.
