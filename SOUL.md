# DreamMakers Finance - Soul

## Product Purpose
DreamMakers Finance is an internal executive finance dashboard for DreamMakers. It gives the team one controlled place to track recurring income, recurring expenses, one-time movements, cash on hand, runway, and deterministic financial projections without adding a database or paid infrastructure.

The app is intentionally small and operational: authorized users sign in, maintain financial rows backed by Google Sheets, and use the dashboard to understand current monthly health and future cash flow.

## Core User Journey
1. A user opens the root route.
2. The app checks the NextAuth Google session and the `ALLOWED_EMAILS` allowlist.
3. Unauthenticated users go to `/sign-in`; non-allowlisted users go to `/access-denied`; allowlisted users go to `/dashboard`.
4. The dashboard loads financial entries from the Google Sheets `financial_data` tab and global settings from the `settings` tab.
5. The user reviews operations, projections, or insights.
6. The user can add, edit, finish, or delete entries. Mutations go through protected API routes and write back to Google Sheets.
7. The UI refreshes server data after mutations so calculations and charts stay aligned with the sheet source of truth.

## Source Of Truth
Google Sheets is the persistence layer.

### `financial_data`
Rows use this contract:

```txt
id, concept, type, frequency, amount, start_date, end_date, notes
```

- `id`: app-generated UUID.
- `concept`: human-readable finance concept.
- `type`: `income` or `expense`.
- `frequency`: `monthly`, `annual`, or `one_time`. Legacy `yearly` sheet values are normalized to `annual` on read.
- `amount`: positive number.
- `start_date`: ISO date in `YYYY-MM-DD`.
- `end_date`: optional ISO date in `YYYY-MM-DD`; used to stop recurring entries.
- `notes`: optional free text.

One-time entries always have `end_date` normalized to `null`.

### `settings`
Rows use `key, value` pairs:

- `currency`: `USD` or `ARS`.
- `cashOnHand`: optional number used for runway and cash-base projections.

### `entry_relations`
Rows store direct relationship edges for the relationship graph:

```txt
id, entry_id, target_type, target_id, created_at
```

- `target_type`: `entry` or `label`.
- Entry-to-entry relationships are bilateral in product behavior and stored canonically as one row.
- Entry-to-label relationships connect only that entry to the label; they do not implicitly connect the entry to other entries under the same label.

### `entry_relation_labels`
Rows store reusable relationship label nodes:

```txt
id, name, created_at, updated_at
```

Labels are entities in the graph. They can group multiple entries while keeping smaller financial ecosystems isolated from larger ones.

## Main Application Areas
### Authentication
- NextAuth uses Google OAuth with JWT sessions.
- `ALLOWED_EMAILS` is enforced during sign-in, page access, and API access.
- Page guards live in `lib/auth.ts`.
- Environment validation lives in `lib/env.ts`.

### Dashboard Shell
`/dashboard` is server-rendered enough to fetch the initial entries and settings, then hands data to the client-side `FinanceDashboard`.

The dashboard has three tabs:

- `Operations`: current-month KPI cards and the financial entries table.
- `Projections`: 12-month table, strategic horizon summaries, and projection graphs.
- `Insights`: expense distribution, income versus expenses over time, recurring commitments, and financial stability.

### Entries Management
Entries can be created, edited, finished, and deleted.

- Create: `POST /api/entries`.
- Update: `PATCH /api/entries/[id]`.
- Delete: `DELETE /api/entries/[id]`.
- List: `GET /api/entries`.
- Detail graph: `/entries/[id]`.

All entry payloads are validated with Zod schemas in `types/entry.ts`.

Finishing an entry is a UI shortcut that patches `end_date` to today's date. This is mainly for recurring commitments that should stop affecting future months.

### Relationship Graph
Each entry can be opened from the Entries table. The entry detail page shows a React Flow graph centered on that entry and limited to direct neighbors. The graph uses a force-style layout with node repulsion, edge attraction, and gravity toward the central entry.

Relationships can connect:

- Entry to entry.
- Entry to label.

The add relation flow supports searching entries and labels, selecting multiple targets, creating a new label from the search text, or creating a new entry and immediately relating it to the current entry. Monthly, annual, and one-time entries are all valid relationship targets. Already-related targets and pending selections are excluded from the picker.

Graph node positions are remembered per entry in browser `localStorage`. Users can drag nodes into a useful arrangement or reset the layout back to the automatic force layout.

Direct entry relationships can be converted into a label. When that happens, the direct entry-entry edge is removed and both entries are connected to the label node. This preserves the label as the shared context without making every entry under that label directly related to each other.

Clicking an entry node navigates to that entry detail page. Clicking a label node navigates to the connected income with the highest amount; if the label has no connected income, it navigates to the connected expense with the highest amount.

Relationship APIs:

- `GET /api/entries/[id]/relationships`.
- `POST /api/entries/[id]/relationships`.
- `DELETE /api/entries/[id]/relationships/[relationshipId]`.
- `PATCH /api/entries/[id]/relationships/[relationshipId]/label`.

Deleting an entry also deletes its relationships so the graph does not keep broken references.

### Settings Management
Global settings are read and updated through:

- `GET /api/settings`.
- `PATCH /api/settings`.

Settings are validated with Zod schemas in `types/settings.ts`.

## Finance Rules
The app computes finance metrics in application code, not in sheet formulas.

### Monthly Equivalent
`monthlyEquivalentForMonth` is the central rule for translating an entry into a monthly amount:

- Monthly entries contribute their full amount while active.
- Annual entries contribute `amount / 12` while active.
- One-time entries contribute their full amount only in their start month.
- Entries do not contribute before `start_date`.
- Entries do not contribute after `end_date` when `end_date` exists.

### KPIs
Current operations KPIs are calculated from recurring entries active in the selected base month:

- Monthly recurring income.
- Monthly recurring expenses.
- Net monthly result.
- Burn rate.
- Runway months when `cashOnHand` exists and burn rate is greater than zero.

### Monthly Projection
The 12-month projection includes monthly, annual, and one-time entries according to their active month rules. It produces income, expenses, and net result per month.

### Strategic Projections
Strategic projections evaluate recurring entries over fixed horizons:

- 6 months.
- 1 year.
- 2 years.
- 4 years.

These summaries include total income, total expenses, net result, accumulated cash flow from zero, accumulated cash flow from cash on hand, burn rate, runway, and a separate one-time balance disclaimer for one-time entries inside the horizon.

## Insights Rules
Insights focus on recurring operational health:

- Expense distribution groups active recurring expenses by concept for the current month.
- Income versus expenses timeline starts at the earliest recurring entry start month and ends at the current month or the latest future recurring end month.
- Recurring commitments show the top active monthly-equivalent recurring expenses.
- Financial stability is positive, neutral, or negative based on current net monthly margin.

## Technical Shape
- Framework: Next.js App Router with TypeScript.
- UI: React client components, Tailwind CSS, local UI primitives under `components/ui`.
- Auth: NextAuth Google OAuth.
- Persistence: Google Sheets API through a service account.
- Validation: Zod schemas at API and sheet-mapping boundaries.
- Formatting: centralized currency and date helpers.
- Graphing: React Flow for entry relationship maps.

Important folders:

- `app/`: routes and API handlers.
- `components/`: dashboard, tables, forms, charts, and shared UI.
- `hooks/`: client-side projection and insights data preparation.
- `lib/finance/`: calculations and projection logic.
- `lib/sheets/`: Google Sheets client, mapping, entries, and settings.
- `types/`: shared domain and API types.

## Product Constraints
- This is an internal tool, not a multi-tenant SaaS product.
- Google Sheets is the source of truth; do not introduce a separate database unless the product direction changes explicitly.
- Keep the app free-tier friendly and easy for a single engineer to maintain.
- Keep financial calculations deterministic and explainable.
- Treat the sheet contract as a compatibility boundary. Changes to columns or semantics require migration-aware handling.
- Avoid committing secrets or `.env.local`.

## Feature Integration Guidance
When adding or changing a feature:

1. Preserve the allowlisted internal-user model unless the feature explicitly changes access control.
2. Update Zod schemas when the data contract changes.
3. Update Google Sheets mapping and headers when sheet-backed data changes.
4. Keep finance math in `lib/finance/*` or hooks that compose those functions.
5. Keep API responses in the `{ data, error }` shape already used by the project.
6. Refresh server data after client mutations so dashboard calculations reflect persisted state.
7. Add UI in the existing dashboard structure unless the feature clearly deserves a new route.
8. Update this `SOUL.md` whenever a feature changes product behavior, data flow, calculations, routes, external integrations, or user workflows.

## Current Mental Model
DreamMakers Finance answers three operational questions:

- What is the company's current recurring monthly position?
- How does that position affect runway and cash flow over the next months and years?
- Which finance entries explain the numbers enough for leadership to act?

Every feature should make one of those answers clearer, more accurate, or easier to maintain.
