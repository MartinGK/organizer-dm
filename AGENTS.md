# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 App Router project with TypeScript.
- `app/`: routes, layouts, auth pages, dashboard pages, and API handlers (`app/api/*`).
- `components/`: feature components (`finance-dashboard.tsx`, tables, forms) and shared UI in `components/ui/`.
- `lib/`: domain logic (`lib/finance/*`), Google Sheets integration (`lib/sheets/*`), auth/env helpers, and formatting utilities.
- `types/`: shared TypeScript types for entries, settings, and API contracts.
- `public/`: static assets.
- Root configs: `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `.env.example`.
- Data contract note: `financial_data` rows are `id, concept, type, frequency, amount, start_date, end_date, notes` (`end_date` optional).

## Build, Test, and Development Commands
Use npm scripts from `package.json`:
- `npm run dev`: start local dev server at `http://localhost:3000`.
- `npm run build`: create production build.
- `npm run start`: run the production server from the build output.
- `npm run lint`: run ESLint with Next.js core-web-vitals + TypeScript rules.

## Coding Style & Naming Conventions
- Language: strict TypeScript (`tsconfig.json` has `strict: true`).
- Imports: use the `@/*` path alias for root-based imports when helpful.
- Indentation: 2 spaces; keep files formatted consistently with existing code.
- Naming:
  - Components: `PascalCase` file exports (files are mostly kebab-case, e.g. `entries-table.tsx`).
  - Utilities/types: descriptive lowercase file names grouped by domain (`lib/finance/calculations.ts`).
  - API routes: Next.js App Router conventions (`app/api/<resource>/route.ts`).

## Testing Guidelines
No test framework or coverage gate is currently configured in this repository.
When adding tests, colocate them clearly (e.g., `lib/finance/calculations.test.ts`) and prioritize:
- finance calculation correctness,
- API route validation/error paths,
- Sheets mapping/parsing edge cases.

## Commit & Pull Request Guidelines
Git history is not available in this checkout, so no repository-specific commit pattern could be verified.
Use clear, imperative commits (e.g., `feat: add annual expense normalization`) and keep each commit focused.
For pull requests, include:
- what changed and why,
- screenshots/GIFs for UI changes,
- environment/config updates,
- manual verification steps (commands run, flows tested).

## Security & Configuration Tips
- Never commit `.env.local` or service account secrets.
- Keep `ALLOWED_EMAILS` restricted to approved users.
- Ensure OAuth callback URLs match local and deployed domains.
