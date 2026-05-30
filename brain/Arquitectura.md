---
tags: [tecnico, arquitectura, stack]
updated: 2026-05-30
---

# Arquitectura

## Stack

- **Next.js App Router** (RSC + client components, Server Actions).
- **Supabase** (Postgres + RLS). Lectura/escritura vía **service client**
  (`createServiceSupabaseClient`) con `getSupabaseServiceEnv()`; degradación
  elegante cuando falta env o tabla.
- **PWA** (manifest, service worker, push). `@anthropic-ai/sdk` para [[IA y coste]].
- **framer-motion** + **lenis** para motion. Ver [[Sistema de diseño]].

## Modelo de datos (multi-tenant)

Todo cuelga de `workspaces` (cada marca = un workspace). Tablas clave: member_profiles,
workout/diet templates + assignments, food_diary_entries, customer_checkins,
community_posts, coach_ai_brains, ai_usage_events, push_subscriptions,
retention_outreach, support_conversations… Migraciones en `supabase/migrations`
(auto-aplican en merge a main, ver [[Infraestructura]]).

## Auth y roles

`lib/auth/access-control.ts` — `getConsoleSession()`, `canManageWorkspace()`,
`requireWorkspaceMutationAccess()`. Roles en `role-access.ts`. `COACHOS_OWNER_EMAIL`
otorga platform_owner.

## La frontera PWA vs nativo (decisión nº1)

- **PWA hoy:** todo el cerebro (IA, planes, radar, push web, comunidad), logging
  por foto, análisis de técnica por cámara.
- **Necesita nativo (Capacitor/RN):** HealthKit/Health Connect, BLE, **Apple
  Watch**, push fiable iOS, audio en background, store. → es la conversión de pago
  del entrenador. Ver [[Roadmap]] y [[Decisiones]].
