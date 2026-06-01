# Handoff — Auditoría + estabilización (2026-06-01)

> Continuación tras la auditoría seria de toda la web/PWA y el cierre de las
> fases de estabilización. Lee también `handoff.md` (objetivo y roadmap) y
> `CLAUDE.md`. **Producción Supabase = `gsfzigayzqhzbtrmmiqq`** (verificado en el
> bundle desplegado), no `atfsgvetqxjmmsokswja`.

## Estado de ramas / PRs
- **`main`**: base antigua.
- **#73 · `claude/keen-ramanujan-X9vqU`**: feature line completo (Fase 1 billing 25%,
  nutrición/entreno, UX) + **fixes de seguridad** (guard de `updateBrandingAction`
  + IDORs cerrados) + pulido del webhook Stripe.
- **#74 · `claude/intelligent-dirac-OmNlE`** (apilado sobre #73): migraciones de
  advisors + **Fase 2 funnel** (`/c/[slug]` + checkout + provisión post-pago) +
  **fix de fiabilidad del webhook** + **toda la estabilización del audit** (abajo).
- **Para producción: mergear #73 → luego #74.** Preview de #74 desplegada y READY.
- typecheck + 63 tests verde en cada commit.

## Cerrado esta sesión (estabilización del audit, todo en #74)
- **Fase A** (`f25cb4f`): mató el 500 de prod en meals/diary — el workspace se
  resuelve de la sesión (`requireMemberWorkspaceId`), no del form; Smart-Add IA
  ya no revienta.
- **Fase B** (`a87f8c5`): mismo blindaje en 12 member-actions (hábitos, cardio,
  comunidad, suplementos, foods, ciclo, workouts, check-in, perfil, recetas,
  soporte, retos). El 500 sistémico del member está **muerto**.
- **Fase C·1** (`3419c4b`): `clampMemberStatus` ya **no da acceso sin pago**;
  `recordWebhookEvent` ya **no suelta eventos de pago** (distingue 23505 de error
  transitorio → 500 + retry).
- **Fase C·2** (`4951c28`, `a45df25`, `dbedf27`): funnel navegable —
  - Panel **“Tu página de ventas”** (copiar/abrir `/c/[slug]`) en `/coach/billing`.
  - Login **passwordless** (magic link) en `/acceso` y `/m` (los miembros no tienen
    contraseña; password queda secundario).
  - **Magic link a prueba de dispositivo**: `?w=<slug|id>` viaja en el enlace →
    `AuthHashBridge` lo reenvía → `/auth/session` fija la cookie
    `performlabs_workspace_id` → el miembro cae en SU coach aunque abra el email en
    otro dispositivo. `/gracias` pide el email del pago.

## Lo que QUEDA (P1/P2 — post-piloto, ideal en conversación nueva)
Del informe de auditoría (4 superficies + backend). Prioridad:
1. **Feedback global de acciones** (member + coach): muchas acciones no confirman;
   estandarizar en el `SubmitButton` con toast; sustituir `<button>` crudos.
   Hay DOS `SubmitButton` (uno con toast en `components/ui`, otro sin). 
2. **Coach a escala**: ficha `/coach/members/[id]` + edición + acciones masivas;
   Mensajes a 2 paneles; **ver fotos de check-in** (hoy solo tag “Sí/No”);
   **Analytics real** (datos ya existen: retención, billing, check-ins).
3. **Densidad** coach: aplicar el patrón facetado de Ejercicios a
   members/messages/checkins/nutrition (queja del CEO, `docs/ux-audit-2026.md`).
4. **Landing dual-audience**: rutas “soy coach → /registro” y “soy cliente → /acceso”;
   el operador no puede disparar Connect/planes desde `/console`.
5. **PWA**: iconos 192 + maskable + `id` en manifest; página `/offline` + precache;
   cola offline; **encender push** (env `VAPID_*` + `CRON_SECRET`).
6. **Contenido vacío**: `supplements` y `challenges` arrancan a 0 — semilla o empty
   states que guíen.
7. **Dead-ends**: `/app/guides` (cards que no abren), `/console/community` y
   `/console/billing` (placeholders/sistema paralelo).
8. **Cloudinary**: cloud hardcodeado `dxyl7od6t` → usar URL original si no hay env.

### Deferidos pequeños (P0-ish ya mitigados, mejora pendiente)
- `/gracias` **auto-prefill** del email: pasar `?session_id={CHECKOUT_SESSION_ID}` en
  el `success_url` y recuperar `customer_details.email` (añadir `stripeAccount` a
  `retrieveCheckoutSession`). Hoy se pide el email del pago por copy (suficiente).
- `onboarding/actions.ts`: única member-action que aún lee `workspaceId` del form
  (tiene su propio try/catch → degrada, pero conviene migrar a `requireMemberWorkspaceId`).

## Pendiente de TI (humano)
- **Stripe E2E en test**: `STRIPE_SECRET_KEY=sk_test…`, `STRIPE_WEBHOOK_SECRET=whsec…`,
  `STRIPE_PLATFORM_PRICE_ID=price…` **solo en env Preview** de Vercel; webhook test a
  la URL del preview con **“Listen to connected accounts” ON**. Luego: conectar
  cuenta coach test → crear plan → `/c/<slug>` → pagar 4242 → verificar
  `member_subscriptions` + `platform_fee_events` (25%).
- Activar **leaked-password protection** (Dashboard → Auth → Password).
- **Rotar** la `sk_test` y el `whsec` que se compartieron en chat.
- Decidir merge **#73 → #74** para llevar todo a producción.

## Comandos
`pnpm install` · `pnpm typecheck` · `pnpm test` · `pnpm build`. (Ojo: `pnpm lint`
está roto — Next 16 quitó `next lint`; migrar a eslint CLI.)
