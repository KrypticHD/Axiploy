# Axiploy — Project State

Last updated: 30 June 2026

---

## Current Goal

Build an investor-ready working SaaS product. Zero mock data for real clients, all features fully wired to real Supabase data, real AI responses via Claude API. Target: demo-ready for capital raise.

---

## What Has Been Completed

### Infrastructure
- Next.js 16 App Router + TypeScript + Tailwind v4
- Supabase (Postgres + Auth + Storage) fully wired
- Cookie-based portal auth (`axiploy_session` httpOnly cookie)
- Auth protection via `src/proxy.ts` (covers `/portal/*` and `/admin/*`)
- `@anthropic-ai/sdk` installed
- Resend for transactional email
- Deployed to Vercel via GitHub (auto-deploys on push to `main`)
- Live at axiploy.com (custom domain on Vercel)

### Portal Pages — All Real Data (no mock fallbacks)
| Page | Status |
|---|---|
| Dashboard | ✅ Real Supabase data, no mock |
| Onboarding | ✅ Real data, empty state when no records |
| AI Workforce | ✅ Real data, Configure button links to Support |
| Approvals | ✅ Real data, starts empty (no mock flicker) |
| Activity Feed | ✅ Real data + CSV export |
| Notifications | ✅ Real data, mark-as-read in localStorage |
| Reports | ✅ Real Supabase metrics, PDF export, savings calculator |
| Knowledge Base | ✅ Upload/download/rename/category/delete all wired to Supabase Storage |
| Email Templates | ✅ Loads from Supabase, auto-seeds 5 defaults, real save |
| Workflows | ✅ Reads `workflow_runs` table, read-only, "Managed by Axiploy" |
| Ask Axiploy | ✅ Claude API (claude-haiku-4-5-20251001) when ANTHROPIC_API_KEY set; keyword engine fallback |
| Settings (Profile) | ✅ Real save to `users` table |
| Settings (Password) | ✅ Supabase Auth admin update |
| Settings (Notifications) | ✅ Saves to `users.preferences` JSONB |
| Settings (Users) | ✅ Shows current user + "Contact Axiploy" CTA (no broken invite) |
| Settings (Plan & Usage) | ✅ Real counts from `/api/portal/reports/metrics` |
| Settings (Security/Sessions) | ✅ "Coming Soon" (no fake sessions) |
| Support | ✅ Saves to `support_requests` table + Resend email to cainbrammer2@hotmail.com |

### Admin Panel
- Real client list from Supabase
- Per-client agent assignment (add/remove digital employees)
- Agent types: Onboarding Assistant, Admin Assistant, Growth Assistant

### Marketing Site
- Homepage, About, Technology, Contact, Services pages
- Beta signup page at `/beta` (standalone, no nav/footer)
- Contact form via Resend

### API Routes (all in `src/app/api/portal/`)
- `activity/` — GET
- `approvals/` — GET, PATCH
- `ask/` — POST (Claude API + fallback)
- `knowledge/` — GET, PATCH, DELETE
- `knowledge/upload/` — POST (Supabase Storage)
- `knowledge/download/[id]/` — GET (signed URL, force download)
- `me/` — GET
- `notifications/` — GET
- `onboarding/` — GET + `[id]/` dynamic
- `reports/metrics/` — GET (real aggregated stats)
- `settings/profile/` — POST
- `settings/password/` — POST
- `settings/preferences/` — GET, PATCH
- `support/` — POST
- `templates/` — GET (with default seeding), PATCH
- `workflows/` — GET

---

## Database Tables (Supabase)

All SQL has been run. Tables in use:
- `clients` — one row per business client
- `users` — portal users (with `preferences` JSONB column)
- `digital_employees` — AI workforce per client
- `onboarding` — employee onboarding records (with `token` column for magic link)
- `approvals` — approval queue
- `activity_log` — activity feed
- `documents` — onboarding documents
- `support_requests` — support form submissions
- `knowledge_documents` — knowledge base file metadata
- `email_templates` — customisable email templates (per client, seeded with 5 defaults)
- `workflow_runs` — n8n execution history (populated by n8n webhook)

Supabase Storage bucket: `knowledge-base` (private, service role uploads)

---

## Files Changed (this conversation — key files)

```
src/app/portal/(app)/reports/page.tsx         — real metrics, PDF export
src/app/portal/(app)/knowledge/page.tsx        — real upload/download/rename/delete
src/app/portal/(app)/templates/page.tsx        — real save to Supabase
src/app/portal/(app)/workflows/page.tsx        — real workflow_runs, read-only
src/app/portal/(app)/notifications/page.tsx    — localStorage mark-as-read, no mock
src/app/portal/(app)/activity/page.tsx         — no mock fallback, empty state
src/app/portal/(app)/dashboard/page.tsx        — no mock fallbacks
src/app/portal/(app)/approvals/page.tsx        — starts with [], no mock
src/app/portal/(app)/onboarding/page.tsx       — no mock fallback
src/app/portal/(app)/workforce/page.tsx        — no mock fallback, Configure → Support
src/app/portal/(app)/settings/page.tsx         — real Plan/Users/Sessions tabs
src/app/api/portal/reports/metrics/route.ts    — NEW
src/app/api/portal/knowledge/route.ts          — NEW (GET, PATCH, DELETE)
src/app/api/portal/knowledge/upload/route.ts   — NEW
src/app/api/portal/knowledge/download/[id]/route.ts — NEW
src/app/api/portal/templates/route.ts          — NEW
src/app/api/portal/workflows/route.ts          — NEW
src/app/api/portal/settings/preferences/route.ts — NEW
src/app/api/portal/ask/route.ts                — updated to use Claude API
```

---

## Current Errors / Known Bugs

- **None blocking** — TypeScript builds clean, Vercel deploys green (latest commit: `c2c26f5`)
- **Workflows page** — will show empty state until n8n is configured to POST to `/api/webhooks/n8n` on workflow completion (expected — not a bug)
- **Ask Axiploy** — falls back to keyword engine until `ANTHROPIC_API_KEY` is added to Vercel env vars

---

## Credentials & Access

### Supabase
- **Dashboard:** https://supabase.com → sign in with Cain's account
- **Project ref:** `hqxtkylchfetaxabjvlv`
- **Project URL:** `https://hqxtkylchfetaxabjvlv.supabase.co`
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxeHRreWxjaGZldGF4YWJqdmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTAwNjcsImV4cCI6MjA5ODIyNjA2N30.fLI710iBilELiB0reNICM1GzsRTqazD_iIg-L7Tx9mA`
- **Service role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxeHRreWxjaGZldGF4YWJqdmx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY1MDA2NywiZXhwIjoyMDk4MjI2MDY3fQ.h5lsIfAbfB6KsFSVpMbgzm1SJ7kH9drlhJVOy1HR03A`

### GitHub
- **Repo:** https://github.com/KrypticHD/Axiploy.git
- **Branch:** `main` (auto-deploys to Vercel on push)

### Vercel
- **Dashboard:** https://vercel.com → sign in with Cain's account (linked to GitHub)
- **Project:** Axiploy
- **Production URL:** axiploy.com
- **Latest deployed commit:** `c2c26f5`

### Resend (email)
- **Dashboard:** https://resend.com → sign in with `cainbrammer2@hotmail.com`
- **API key:** stored in Vercel env vars as `RESEND_API_KEY` (retrieve from Resend dashboard → API Keys)
- **Notification email target:** `cainbrammer2@hotmail.com` (support form + contact form)

### Anthropic (Claude API)
- **Dashboard:** https://console.anthropic.com
- **API key:** NOT yet added to Vercel — add as `ANTHROPIC_API_KEY` to unlock real Ask Axiploy responses
- **Model used:** `claude-haiku-4-5-20251001`

### Portal Logins
- **Client portal login:** https://axiploy.com/portal/login
- **Admin panel:** https://axiploy.com/admin (requires `role = "axiploy_admin"` in Supabase `users` table)
- **To create a client user:** Insert row into `users` table in Supabase with `role = "client_admin"` and matching `client_id`
- **Demo credentials (mock-data.ts fallback only):** `demo@axiploy.com` / `Axiploy2024!`

---

## Environment Variables

### Set in Vercel (required) — also in `.env.local` for local dev
| Variable | Value / Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hqxtkylchfetaxabjvlv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | See Credentials section above or Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | See Credentials section above or Supabase dashboard → Settings → API |
| `RESEND_API_KEY` | Resend dashboard → API Keys → retrieve/regenerate |

### Not yet in Vercel — add these to unlock remaining features
| Variable | Purpose | Where to get |
|---|---|---|
| `ANTHROPIC_API_KEY` | Real Claude responses in Ask Axiploy | console.anthropic.com → API Keys |
| `N8N_WEBHOOK_SECRET` | Verifies n8n webhook payloads | Set any random string in both n8n and here |
| `N8N_BASE_URL` | n8n instance URL | Your n8n instance URL |

### Local `.env.local` file
Located at `axiploy/.env.local` — already has Supabase keys. Add `RESEND_API_KEY` and `ANTHROPIC_API_KEY` here for local testing.

---

## Exact Next Steps (in priority order)

1. **Add `ANTHROPIC_API_KEY` to Vercel** — Go to Vercel → Project → Settings → Environment Variables → add key → redeploy. Ask Axiploy will then use real Claude.

2. **Wire n8n to write workflow runs** — In n8n, add an HTTP Request node at the end of each workflow that POSTs to `https://axiploy.com/api/webhooks/n8n` with `{ workflow_name, digital_employee, status, duration_ms, result, client_id }`. The Workflows page will then show real data.

3. **Admin panel Phase 10** — Add platform-wide metrics to `/admin` (total clients, total tasks, total hours across all clients). Add per-client activity + onboarding summary to `/admin/clients/[id]`.

4. **Stripe** — When ready to take payments: add Stripe subscription, wire `/api/stripe/webhook` to create/disable client accounts automatically.

5. **Employee onboarding portal** — Public-facing `/onboard/[token]` page where new employees upload documents directly. Token auto-generated, emailed by n8n. Documents land in Supabase Storage and update portal automatically.

---

## What Must Not Be Lost

- The `src/proxy.ts` file handles all auth protection — do NOT create `src/middleware.ts` (causes conflict and build failure)
- Knowledge Base uses **private** Supabase Storage bucket — downloads must go through the signed URL API route, not direct public URLs
- `supabaseAdmin()` is the server-side admin client (bypasses RLS) — always use this in API routes, never the anon client
- Session cookie is `axiploy_session` — JSON string with `{ id, email, name, role, clientId, clientName, accessToken }`
- Email templates are **seeded automatically** on first GET if none exist for a client — no manual SQL needed
- The `@anthropic-ai/sdk` package is installed and in `package.json`
- Vercel deploys from `main` branch of `https://github.com/KrypticHD/Axiploy.git`
