# Leapfrog plan — out-build Macroactive

Macroactive proved the market (white-label coaching apps, +$160M trainer
earnings) but is a 10-year-old, sales-led, template-automation product. The gap
we attack: **AI-native, premium UX, and speed**. This is the roadmap to be the
category leader, not a clone.

## Where they're beatable

| Their weakness | Our 10× move |
| --- | --- |
| Rule/template automation, not real AI | **AI-native**: program & meal generation, check-in analysis, adaptive plans, coach copilot |
| Dated dashboard UX | **Premium UX** (Apple/Whoop/Linear feel): rings, insights, motion, command palette |
| Sales-led, slow onboarding (~10 days, demos) | **Self-serve + guided**: launch in hours, in-product setup |
| Coach does the thinking | **Intelligence layer**: adherence/churn risk, "resolve-first" queues, nudges |
| Generic member app | **Member app that retains**: streaks, readiness, social/accountability, delight |

## Bets, prioritized

### P0 — Premium UX foundation (in progress)
- Design tokens, primitives, motion, glass, gradient — **done**.
- Member app **progress rings** (Whoop-style) — **shipped**.
- Landing rebuilt with ownership-first, Macroactive-grade structure — **shipped**.
- Next: ambient depth on app shell, command palette (⌘K), consistent skeletons/empty states.

### P1 — Intelligence layer (AI-ready, needs API key + Supabase wiring)
- **Coach copilot** (Claude): "summarize this client's week", "draft a plan", "why is adherence dropping?".
- **AI program/meal generation** from the member briefing (we already capture goal, days, restrictions, injuries).
- **Check-in analysis**: turn photos/weight/notes into a prioritized action + suggested tweak.
- **Adherence & churn signals** surfaced in the coach `AttentionQueue` (already the right home).
- Infra: add `@anthropic-ai/sdk`, an `ANTHROPIC_API_KEY` server env, stream responses; cache prompts. (See the `claude-api` skill.)

### P2 — Member retention & delight
- Streaks, readiness score, weekly recap, celebratory moments.
- Real-time messaging, push notifications, accountability nudges.
- Offline-first PWA, fast installs.

## Guardrails
- **Truthful marketing** — no invented metrics/testimonials until real.
- **Security first** — member auth still owed (`/app` finding #1 in SECURITY.md).
- **Performance** — lazy-load heavy (3D/AI) chunks; GPU-only animations; reduced-motion.
- Every feature passes the bar: *would this feel premium for a venture-backed category leader?*
