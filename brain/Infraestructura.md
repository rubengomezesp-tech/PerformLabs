---
tags: [tecnico, infra, devops]
updated: 2026-05-30
---

# Infraestructura

## Hosting y dominio

- **Vercel** (plan Hobby). Producción = rama `main`; ramas = Preview.
- Dominio `performlabs.app` en **Cloudflare** (DNS only para los registros que
  apuntan a Vercel). El **wildcard `*.performlabs.app` está aparcado**: Vercel
  exige sus nameservers para el cert comodín y eso choca con Cloudflare; se hará
  con **Cloudflare for SaaS** cuando escale. No bloquea nada. Ver [[Decisiones]].

## Variables de entorno (Vercel → Production)

| Var | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `ANTHROPIC_API_KEY` | Toda la [[IA y coste|IA]] (degrada en oscuro sin ella) |
| `COACH_BRAIN_MODEL` / `PLAN_GENERATOR_MODEL` / `VISION_NUTRITION_MODEL` | Tiering de modelos (opcional) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_CONTACT` | Web Push |
| `CRON_SECRET` | Protege `/api/cron/nudges` (Vercel Cron lo manda como Bearer) |
| `COACHOS_OWNER_EMAIL` | Otorga platform_owner |

> Tras añadir env vars: **Redeploy** (los `NEXT_PUBLIC_*` se incrustan en build).

## Migraciones (CI)

`.github/workflows/deploy-migrations.yml` aplica `supabase db push` en cada push de
`supabase/migrations/**` a `main` (environment `PerformLabs`). **El usuario no hace
nada manual.**

## Cron

`vercel.json` → `/api/cron/nudges` diario (encaja en límites Hobby). Manda los
[[Features|avisos proactivos]].
