# PerformLabs Engineering Guide

Version: 1.1
Updated: May 2026

This guide describes how we work on the PerformLabs codebase. It complements `docs/platform-architecture.md`, `docs/surgical-supabase-architecture.md`, and `docs/product-tree-and-phases.md`.

## Principles

- Keep `main` deployable.
- Build white-label surfaces first: trainers and members should never see PerformLabs internals.
- Keep complex algorithms inside domain/repository layers; user-facing UI should be simple and human.
- Prefer server components and server actions unless a feature genuinely needs browser state.
- Use `pnpm` only. Do not commit `package-lock.json`.

## Local Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

Use `pnpm exec next dev -H 127.0.0.1 -p 3000` when you need an explicit local host/port.

## Code Conventions

- TypeScript strict stays enabled.
- Avoid `any`. If Supabase or third-party data makes it unavoidable, keep the scope tiny and explain why.
- Use `type` by default. Use `interface` only for public extensible contracts.
- Use absolute imports: `@/lib/...`, `@/components/...`.
- File and folder names use `kebab-case`.
- React components use `PascalCase`.
- Functions and variables use `camelCase`.
- SQL tables and columns use `snake_case`.
- Server actions use `verbXxxAction`.
- Repository reads use `listXxx()` or `getXxx()`.
- Repository writes use `createXxx()`, `updateXxx()` or `setXxxActive()`.

Import order:

```ts
// 1. Next/React
import Link from "next/link";

// 2. External libraries
import { z } from "zod";
import { Dumbbell } from "lucide-react";

// 3. Internal lib
import { getSelectedMemberAppBrand } from "@/lib/member-app";

// 4. Components
import { Topbar } from "@/components/topbar";

// 5. Same-folder actions/helpers
import { saveWorkoutSessionAction } from "./actions";
```

## Server And Client Components

Server components are the default.

Use `"use client"` only for:

- React hooks.
- DOM events.
- Browser APIs.
- Client animation/runtime libraries.

Do not mark a full page as client because one small control needs state. Extract that control.

## Error Handling

Repository reads:

- Prefer graceful fallback when the local database is missing.
- Log concise technical context with `console.error`.
- Do not expose technical errors to end users.

Repository writes:

- Validate required fields before SQL.
- Throw clear Spanish errors for user-actionable failures.
- Never swallow errors silently.

Server actions:

- Use `FormData`.
- Validate/normalize inputs.
- Write through repositories.
- `revalidatePath`, `redirect`, or throw.

UI:

- Empty data gets `EmptyState` or a simple human message.
- Member/coach UI must not mention Supabase, Vercel, RLS, service role, algorithms, internal entitlements, or PerformLabs ownership.

## Testing

Vitest is installed for domain logic.

Current commands:

```bash
pnpm test
pnpm test:watch
```

Test priority:

- `lib/domain/*`: always test. These engines drive training, nutrition, rotation and scoring.
- `lib/auth/access-control.ts`: test before production hardening.
- Repositories: integration tests once Supabase local is part of the workflow.
- Pages: prefer E2E/visual checks over brittle server component unit tests.

Critical flows to cover later with Playwright:

- Coach creates member and assigns program.
- Member opens `/app/workouts` and saves a session.
- Member opens `/app/meals` and marks meals.
- Member submits check-in and coach reviews it.
- Suspended entitlement blocks `/coach` and `/app`.

## Performance Budgets

Targets:

- Public landing LCP under 2.5s.
- App/coach pages should avoid heavy client JS.
- Three.js only on public/demo experiences, not operational `/coach` or member `/app` screens.
- One page should usually stay under 3-5 independent data reads.
- Avoid rendering huge server HTML, especially repeated `<select>` libraries.

Known watch items:

- Generated mockups in `public/brand` should be optimized before launch.
- Use `Promise.all` for independent reads.
- Use `next/image` when image layout and optimization matter.

## Design And UX Rules

Three audiences have different UI:

- `/console`: internal operator power tool. It can show operational details.
- `/coach`: trainer console. It should be powerful but explain workflows in coach language.
- `/app`: member app. It must be simple, calm and action-oriented.

Member app rule:

- Hide algorithm names, macros jargon, RIR/RPE, internal planning logic and technical implementation.
- Show what to do now, what to mark, what changed, and how to ask the coach for help.

Examples:

- Bad: `RIR 2-3`, `carb cycling`, `sets objetivo`, `algoritmo rotativo`.
- Good: `Reps hechas`, `Peso kg`, `Cómo fue`, `Hecho`, `Cambiar`, `Guardar entreno`.

CSS approach:

- We use plain global CSS in `app/globals.css`.
- Keep existing tokens such as `--gold` even though the current brand color is blue in some themes.
- Do not introduce Tailwind utilities unless we explicitly revise ADR-001.

## CI/CD

GitHub Actions lives in `.github/workflows/ci.yml`.

Pipeline:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
```

Recommended branch protection for `main`:

- Require PR before merge.
- Require CI status check.
- Require linear history.
- Restrict force pushes.

Deploy:

- Vercel deploys from GitHub.
- Schema migrations must land before code that requires them.

## Supabase And Security

Follow the Supabase project skills and `docs/surgical-supabase-architecture.md` before schema changes.

Rules:

- Service role key is server-only.
- `NEXT_PUBLIC_*` variables are public by definition.
- Every operational table should be tenant-scoped with `workspace_id` unless intentionally global.
- RLS must remain enabled on operational tables.
- Storage paths should include `{workspace_id}/...`.
- Every sensitive action should eventually write to `audit_log`.

Production hardening still needed:

- Rate limiting on login.
- CSP headers.
- Storage policy audit.
- Failed-login alerts.
- Full table-by-table RLS review.

## Migrations

Order matters:

1. Create migration.
2. Test locally when Supabase local is available.
3. Apply migration.
4. Regenerate `lib/supabase/database.types.ts`.
5. Commit migration and types together.
6. Commit app code that depends on the schema.

Rollback SQL with a forward migration that reverses the change. Do not rely on automatic down migrations.

## Branching And Commits

Branches:

- `main`: deployable.
- `feat/<name>`: features.
- `fix/<name>`: bug fixes.
- `refactor/<name>`: structure without behavior change.
- `docs/<name>`: documentation.

Commits use Conventional Commits:

```text
feat: add member workout logging
fix: hide technical nutrition terms from member app
test: cover workout engine rotation
docs: add engineering guide
sql: add support conversations
```

## Documentation Map

- `docs/platform-architecture.md`: platform architecture and language.
- `docs/surgical-supabase-architecture.md`: database/security architecture.
- `docs/product-tree-and-phases.md`: product roadmap.
- `docs/nutrition-engine.md`: nutrition engine direction.
- `docs/competitive-product-audit.md`: product/UX reference notes.
- `docs/ENGINEERING.md`: this operating guide.

## Glossary

- Workspace: one trainer brand/tenant.
- Coach: trainer using `/coach`.
- Member: end user using `/app`.
- Console: internal PerformLabs operations at `/console`.
- Entitlement: operational license for a workspace.
- Base library: global shared data such as exercises.
- White-label: trainer/member surfaces do not expose PerformLabs.

## ADRs

### ADR-001: Plain CSS Over Tailwind

Decision: use plain CSS in `app/globals.css`.

Why:

- Existing app already uses global tokens and classes.
- Operational screens need consistent reusable layouts.
- Avoid dependency churn while product UX is still moving fast.

Review trigger:

- CSS becomes too slow to maintain.
- We introduce a formal component library.

### ADR-002: Next App Router With Server Components

Decision: server components by default, server actions for internal mutations.

Why:

- Less client JS.
- Good fit for data-heavy multi-tenant surfaces.
- Native forms work well for MVP speed.

### ADR-003: Supabase Managed Postgres

Decision: Supabase for database, auth/storage direction, RLS and types.

Why:

- Strong multi-tenant RLS model.
- Fast platform iteration.
- Lower operational overhead.

Review trigger:

- Enterprise isolation requirements.
- Scale or compliance requirements exceed Supabase managed fit.

### ADR-004: Full White-Label

Decision: no `Powered by PerformLabs` on trainer/member surfaces.

Why:

- Premium positioning.
- Trainer perceives real ownership.

Consequence:

- Less organic B2B virality.

### ADR-005: `pnpm` Only

Decision: `pnpm-lock.yaml` is the package-manager source of truth.

Why:

- Current repo uses pnpm.
- Mixing npm generated peer dependency drift and install errors.

Rule:

- Do not commit `package-lock.json`.
