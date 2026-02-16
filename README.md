# DreamMakers Finance Dashboard

Executive-grade internal finance dashboard for DreamMakers. Built for free-tier deployment and single-engineer maintenance.

## Stack
- Next.js (App Router, TypeScript)
- NextAuth (Google OAuth)
- Google Sheets (service account)
- Tailwind CSS
- Vercel Free Tier

## Features
- Secure sign-in with Google OAuth
- Strict allowlist via `ALLOWED_EMAILS`
- Income/expense entries with frequency:
  - `monthly`
  - `annual`
  - `one_time`
- Optional `end_date` support for recurring entries
- KPI row:
  - Monthly Recurring Income
  - Monthly Recurring Expenses
  - Net Monthly Result
  - Burn Rate
  - Runway (if cash on hand is configured)
- 12-month linear projection
- Entries table with sorting + filters
- CRUD (add/edit/delete)
- Global settings:
  - Currency (`USD`, `ARS`)
  - Cash on hand (optional)
- Premium dark-first UI with optional light mode

## Project Structure
```txt
app/
  (auth)/
    sign-in/page.tsx
    access-denied/page.tsx
  dashboard/
    page.tsx
    loading.tsx
    error.tsx
  api/
    auth/[...nextauth]/route.ts
    entries/route.ts
    entries/[id]/route.ts
    settings/route.ts
  layout.tsx
  globals.css
  page.tsx
components/
  finance-dashboard.tsx
  dashboard-header.tsx
  kpi-card.tsx
  projection-table.tsx
  entries-table.tsx
  entry-form.tsx
  entry-modal.tsx
  settings-panel.tsx
  filter-bar.tsx
  empty-state.tsx
  skeletons.tsx
  theme-toggle.tsx
  ui/*
lib/
  auth.ts
  env.ts
  sheets/
    client.ts
    mapper.ts
    entries.ts
    settings.ts
  finance/
    calculations.ts
    projection.ts
    types.ts
  format/
    currency.ts
    date.ts
types/
  entry.ts
  settings.ts
  api.ts
middleware.ts
```

## Environment Variables
Create `.env.local` from `.env.example`.

```bash
cp .env.example .env.local
```

Required values:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ALLOWED_EMAILS`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_FINANCIAL_TAB` (default: `financial_data`)
- `GOOGLE_SHEETS_SETTINGS_TAB` (default: `settings`)
- `DEFAULT_CURRENCY` (`USD` or `ARS`)

## Google Cloud + Sheets Setup

### 1) Create a Google Cloud Project
1. Open Google Cloud Console.
2. Create a new project (example: `dreammakers-finance`).

### 2) Enable Google Sheets API
1. In APIs & Services -> Library.
2. Enable **Google Sheets API**.

### 3) Create OAuth credentials (for user login)
1. APIs & Services -> Credentials -> Create Credentials -> OAuth Client ID.
2. App type: **Web application**.
3. Add redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Vercel: `https://<your-vercel-domain>/api/auth/callback/google`
4. Copy Client ID + Client Secret into env.

### 4) Create Service Account (for Sheets read/write)
1. IAM & Admin -> Service Accounts -> Create Service Account.
2. Create key -> JSON (download once).
3. From JSON, copy:
   - `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` -> `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (keep escaped `\\n` in env)

### 5) Create and share spreadsheet
1. Create spreadsheet named **DreamMakers Finance**.
2. Add tab `financial_data` with headers:
   - `id | concept | type | frequency | amount | start_date | end_date | notes`
3. Add tab `settings` with headers:
   - `key | value`
4. Share spreadsheet with service account email as **Editor**.
5. Get Spreadsheet ID from URL and set `GOOGLE_SHEETS_SPREADSHEET_ID`.

## Sample Sheet Template

### `financial_data`
| id | concept | type | frequency | amount | start_date | end_date | notes |
|---|---|---|---|---:|---|---|---|
| 3e8d6d7b-9aa6-4d91-b1fd-8a95ac68e571 | Core SaaS subscriptions | expense | monthly | 1200 | 2026-01-01 |  | Infra + tools |
| a5b4b0d3-6f5e-4a19-a443-93fba6602cf0 | Annual legal retainer | expense | annual | 4800 | 2026-01-01 | 2026-12-31 | Counsel |
| 90ad35d2-c972-4cd3-88ca-f1363f0638e2 | Enterprise contract A | income | monthly | 9000 | 2026-02-01 |  | Main recurring |
| 70e8c8c9-a3dd-447a-b888-c7b2f520f1f2 | Hardware purchase | expense | one_time | 2600 | 2026-03-01 |  | New team laptops |

### `settings`
| key | value |
|---|---|
| currency | USD |
| cashOnHand | 150000 |

## Local Development
```bash
npm install
npm run dev
```
Then open `http://localhost:3000`.

## Vercel Deploy (Free Tier)
1. Push this folder to a Git repo.
2. In Vercel, click **Add New Project** and import repo.
3. Framework preset: **Next.js**.
4. Add all env vars from `.env.example`.
5. Deploy.
6. Ensure Google OAuth redirect URI includes your Vercel domain callback URL.
7. Test with one allowlisted email and one non-allowlisted email.

## Non-Technical Operating Guide
1. Sign in with your allowlisted Google account.
2. Use **Add entry** to record income or expenses.
3. Use frequency correctly:
   - Monthly = every month
   - Annual = auto-normalized to monthly (`amount / 12`)
   - One-time = applied only in its month
4. Use optional end date to stop recurring entries automatically.
5. Review KPI row for monthly health.
6. Set **Cash on hand** in Settings to enable Runway.
7. Use filters/sorting in Entries to inspect details.
8. Edit or delete rows as business data changes.

## Notes
- Internal tool only (no multi-tenant logic).
- No paid infra/services required.
- All finance calculations are computed in app logic, not sheet formulas.
