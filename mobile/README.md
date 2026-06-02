# PerformLabs App Factory (`mobile/`)

Generate + publish **one branded native app per coach** to the App Store and Google Play,
under **each coach's own store account**, repeatable 1→1000. Design of record:
`docs/superpowers/specs/2026-06-02-app-factory-design.md`. Coach onboarding:
`docs/ops/coach-app-onboarding.md`.

> This folder is **isolated** from the Next.js product: its own `package.json` (Capacitor +
> Fastlane) and excluded from the product `tsconfig`/ESLint. Native builds need Xcode/Android
> SDK → they run on a Mac or in CI (`.github/workflows/publish-coach-app.yml`), not in the
> remote sandbox.

## How it works

1. **Sync** — pull each coach's identity + branding + member URL from Supabase:
   ```bash
   # from the repo ROOT (resolves @supabase/supabase-js from root node_modules)
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node mobile/scripts/sync-coaches.mjs [slug]
   ```
   Writes/updates `mobile/coaches/<slug>.json`. Preserves `appId` + `stores.*` refs.

2. **Generate** — materialize one coach's Capacitor project:
   ```bash
   cd mobile && node scripts/generate-app.mjs <slug>
   # → mobile/generated/<slug>/capacitor.config.ts (server.url = coach host) + assets.json
   ```

3. **Build + publish** (Mac/CI):
   ```bash
   cd mobile && npm install
   cd generated/<slug> && npx cap add ios && npx cap add android && npx cap sync
   npx @capacitor/assets generate --assetPath assets   # icon/splash from the coach brand
   cd ../.. && fastlane ios coach:<slug> && fastlane android coach:<slug>
   ```
   Or trigger **Actions → Publish coach app** with `coach_slug` + platform.

## Why a thin server-mode shell

PerformLabs is already **multi-tenant by host** (`lib/member-app.ts`,
`lib/repositories/workspaces.ts`), so each coach's member app at their host already renders
their brand. The native app just loads that host and adds native value (push, splash, status
bar, haptics) — so **no per-coach web build**, and it satisfies Apple's 4.2 guideline.

## Per-coach credentials

Stored as **GitHub Environment** secrets (one environment per coach slug):
`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENT` (iOS) and `PLAY_JSON` (Android). The workflow
selects the right ones with `environment: <coach_slug>`.
