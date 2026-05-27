# PerformLabs

Premium white-label platform for launching coaching apps for fitness professionals.

PerformLabs combines a commercial landing, an internal implementation console, reusable templates, and a client-facing PWA experience for training, nutrition, progress and support.

## Product Scope

- Public landing for qualified coaching app enquiries.
- Internal console for leads, projects, templates and launch operations.
- Multi-brand workspace model.
- White-label member app per trainer brand.
- Training programs, exercise library and workout templates.
- Nutrition templates, recipes, macros and client preferences.
- Progress tracking, onboarding and support flows.
- Brand, domain, content, notifications and launch readiness management.

## Key Routes

- `/` public landing.
- `/gracias` post-enquiry confirmation.
- `/login` platform access.
- `/registro` account creation.
- `/console` internal command center.
- `/console/leads` commercial intake and CRM pipeline.
- `/console/projects` implementation pipeline.
- `/console/templates` delivery templates.
- `/console/apps` brand/workspace management.
- `/console/launch` launch readiness.
- `/app` member dashboard.
- `/app/onboarding` member onboarding.
- `/app/workouts` training.
- `/app/meals` nutrition.
- `/app/progress` progress tracking.
- `/app/support` support.

## Stack

- Next.js
- React
- TypeScript
- Supabase
- CSS modules through global design system styles
- Lucide icons

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs locally at:

```bash
http://localhost:3000
```

If port `3000` is busy, Next.js will choose another available port.

## Supabase

Use [docs/supabase-setup.md](docs/supabase-setup.md) for the database setup.

Do not commit `.env.local`, Supabase service keys or local Supabase CLI temp files.

## Deployment

Target production domain:

```text
performlabs.app
```

Recommended deployment flow:

1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Add the environment variables from `.env.example`.
4. Point `performlabs.app` to the Vercel project from Cloudflare DNS.
5. Verify landing, console login and white-label app routes.

## Product Principle

PerformLabs is built as its own product, with original implementation, own data model and own brand. The goal is to provide a polished operating system for coaching app delivery, not to copy private code or proprietary assets from third-party platforms.
