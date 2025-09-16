Vercel deployment: https://buyer-leads-ochre.vercel.app/

Small app to capture, list and manage buyer leads with validation, filters, and CSV import/export.

Stack
- Next.js App Router (15.x) + TypeScript
- Prisma + Postgres (Supabase) with migrations
- Zod for validation (client + server)
- Supabase Auth (magic link, PKCE) + SSR helpers

Quick Start
1) Install deps
   - `npm install`
2) Env vars (see `.env` for example)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` and `DIRECT_URL`
3) DB migrate/seed
   - `npx prisma migrate deploy`
   - optional seed: `npm run prisma:seed`
4) Dev
   - `npm run dev` → http://localhost:3000
5) Test
   - `npm test`

Auth
- Magic link login from `/login` using Supabase Auth (PKCE).
- Auth callback handled at `/auth/callback` (server route sets cookies).

Data Model
- `buyers` (lead):
  `id, fullName, email?, phone, city, propertyType, bhk?, purpose, budgetMin?, budgetMax?, timeline, source, status=New, notes?, tags[], ownerId, updatedAt`.
- `buyer_history`: `id, buyerId, changedBy, changedAt, diff` (JSON of changed fields).

Pages & Flows
- Create Lead `/buyers/new`
  - Fields: fullName, email, phone, city, propertyType, bhk (conditional), purpose, budgetMin, budgetMax, timeline, source, notes, tags[]
  - Client + server Zod validation:
    - `fullName` ≥ 2; `phone` numeric 10–15; valid `email` if present
    - `budgetMax ≥ budgetMin` when both present (shared validator)
    - `bhk` required iff `propertyType ∈ {Apartment,Villa}`
  - On create: lead + buyer_history entry

- List & Search `/buyers`
  - SSR with pagination (10/page)
  - URL‑synced filters: `city, propertyType, status, timeline`
  - Debounced search across `fullName|phone|email`
  - Sort: `updatedAt` desc
  - Columns: Name, Phone, City, Property, Budget, Timeline, Status, UpdatedAt

- View & Edit `/buyers/[id]`
  - Edit with same validation
  - Concurrency: hidden `updatedAt`; stale edits rejected with friendly message
  - History: last 5 changes from `buyer_history`
  - Back to list button

Import / Export
- CSV Import: `/api/buyers/import`
  - Max 200 rows; strict header order:
    `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status`
  - Per‑row validation; unknown enums cause errors with hints
  - Inserts only valid rows inside a transaction; returns `{ inserted, errors[] }`
- CSV Export: `/api/buyers/export`
  - Exports the current filtered list (respects filters/search/sort)

Ownership & Auth
- Logged-in users can read the list and detail pages.
- Owner attribution stored on leads; future enhancement can scope edits by `ownerId`.

Quality Bar
- Unit test
  - `tests/validators.test.mjs` exercises the shared budget range validator
- Simple rate limit
  - In-memory per-IP guard
  - Create: 10/min; Update: 30/min; returns 429 with `Retry-After`
- Error boundary + empty state
  - `src/app/buyers/error.tsx` provides a friendly error card
  - Buyers list shows a clear empty state with CTA
- Accessibility basics
  - All fields labeled
  - Live region announces form/server errors
  - `aria-invalid` + `aria-describedby` on errored inputs
  - Keyboard focus moved to first invalid field on submit

Design Notes
- Validation lives in `src/app/lib/validation/buyer.schema.ts` (Zod) and is shared client/server.
- SSR for `/buyers` keeps filters, pagination and sort on the server.
- Import uses a small custom CSV parser to avoid extra deps and surfaces row-level errors.
- Rate limiting is in-memory per runtime (good for a single instance/local dev). For multi-region/production, replace with a shared store (e.g., Redis).

Project Scripts
- `npm run dev` — start dev server
- `npm run build` — build
- `npm start` — start prod server
- `npm run prisma:seed` — seed DB (optional)
- `npm test` — run unit tests (Node’s test runner)

Sample CSV
```
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
Jane Doe,jane@example.com,9876543210,Chandigarh,Apartment,TWO,Buy,3000000,5000000,LT3M,Website,Looking near IT Park,"hot,priority",Qualified
```

What’s Done vs Skipped
- Done: All must‑have flows (create/list/edit, CSV import/export), validation, SSR filters, simple rate limits, a11y basics, error boundary, unit test, magic‑link auth.
- Skipped (nice‑to‑haves): tag chips/typeahead, status quick‑actions, full‑text search, optimistic UI, file upload.
