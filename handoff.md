# PerformLabs — Handoff de sesión

> Documento de traspaso para continuar en una sesión nueva. Resume **el objetivo
> de la plataforma**, **lo construido**, **lo que está a medias** y **lo que falta**,
> con las notas técnicas críticas para no repetir errores.
>
> **Rama de trabajo:** `claude/keen-ramanujan-X9vqU` · **PR:** #73 (draft)
> **Repo:** `rubengomezesp-tech/performlabs` · **Última actualización:** 2026-05-31

---

## 0. Objetivo de la plataforma (modelo de negocio)

PerformLabs es una **plataforma white-label de coaching de fitness**. El negocio:

1. **Vendemos la app a entrenadores.** Cada entrenador (coach) recibe su **app de marca
   propia** (logo, color `--accent`, nombre) y, idealmente, su **página de venta en su
   propio dominio** (estilo `rubengomezelite.com`).
2. **Cesión white-label progresiva:** cuando un coach compra, se le **provisiona su
   workspace** y se le **ceden permisos** (rol `coach_admin`) sobre su tenant.
3. **Sus miembros se suscriben al coach** vía Stripe. El pago va a la **cuenta Stripe
   Connect del coach** (Direct charge).
4. **PerformLabs se lleva el 25% vitalicio** de cada pago de cada miembro
   (`application_fee_percent` en Stripe), de por vida mientras la suscripción siga activa.

Tres superficies + landing, una sola app Next.js:
- **`/app`** → app del miembro (cliente final).
- **`/coach`** → consola del entrenador (gestiona SU workspace).
- **`/console`** → consola interna de PerformLabs (operadores de plataforma).
- **`/` landing** → marketing de PerformLabs (hoy solo de plataforma, no por coach).

Stack: Next.js (App Router) · React · TypeScript · Supabase (Postgres + RLS) ·
CSS global como design system (`app/globals.css`, lenguaje "Ethereal Glass") · Lucide.
Ver también `CLAUDE.md`, `PRODUCT.md` y `brain/`.

---

## 1. Arquitectura actual (mapa rápido)

### Multi-tenancy
- **No hay `middleware.ts`.** El tenant se resuelve por petición en
  `getSelectedMemberAppBrand()` (`lib/member-app.ts`): usa el **host** cuando es el
  dominio de un coach (`isTenantHost`), si no cae a la cookie `performlabs_workspace_id`
  y, en último término, al primer workspace.
- `getWorkspaceBrand(reference)` (`lib/repositories/workspaces.ts`) busca el workspace por
  `slug / public_domain / member_domain / fallback_subdomain / custom_domain / id`.
  En host desconocido devuelve un **`fallbackBrand()` con UUID cero** (se ve pero no se
  puede escribir → *foot-gun* a blindar en producción).

### White-label
- **Workspace = tenant de un coach** (tabla `public.workspaces`): `name, slug,
  custom_domain, public_domain, member_domain, fallback_subdomain, accent_color,
  app_name, is_active`, …
- Presentación editable (logo, hero, welcome, accent) en filas de **`app_settings`**
  (`brand.*`), fusionada por `applyBrandingSettings`. El coach lo edita en
  `app/coach/brand/page.tsx`.
- El color se inyecta como `--accent` en `components/page-shell.tsx` → todo el design
  system reskinea por coach. (Ojo: `--gold` y `--green` en `globals.css` son **alias** de
  `--accent`/`--success`, no colores fijos.)

### Separación PerformLabs ↔ coach (roles + RLS)
- Roles (`workspace_role`): `platform_owner · agency_admin · coach_admin · coach_staff · member`.
- `/console` → `requireConsoleAccess()`; acciones de plataforma → `requirePlatformAccess()`.
- `/coach` → `requireWorkspaceMutationAccess(brand.id)` (manager en ESE workspace).
- `/app` → `requireMemberContext` (gated por `subscription_status`).
- **RLS** en todas las tablas con `is_workspace_member()` / `has_workspace_role()`.
- ⚠️ **Modo demo:** `localOpenSession()` devuelve `platform_owner` sin auth cuando
  `isConsoleAuthRequired()` es false. **Hay que cerrarlo para producción.**

### Despliegue (Vercel) + entorno
- Proyecto Vercel **`perform-labs-pcgg`** (team `discipline1`), prod en
  `performlabs-eight.vercel.app`. **Está en LIVE.**
- **Env vars ya puestas en Vercel** (Production + Preview):
  `STRIPE_SECRET_KEY` (live), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_CONNECT_CLIENT_ID`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLATFORM_PRICE_ID`,
  `STRIPE_APPLICATION_FEE_PERCENT`, + `SUPABASE_*`, `ANTHROPIC_API_KEY`,
  `GEMINI_API_KEY`, `STITCH_API_KEY`, `VAPID_*`, `CRON_SECRET`, `COACHOS_OWNER_EMAIL`.
- **Supabase project id:** `gsfzigayzqhzbtrmmiqq` (migraciones vía MCP `apply_migration`).
- ⚠️ Las claves son **LIVE**: una tarjeta de test (4242) se **rechaza** en live. Para
  E2E seguro: poner **claves de TEST solo en el entorno Preview** de Vercel y probar ahí.

---

## 2. Lo construido en esta sesión (commiteado en la rama)

### Contenido / datos (nutrición e imágenes)
- **253 alimentos base**, **18 tipos de dieta** (keto real incluido), **126 comidas**.
- **Recetas 33/33 con foto**.
- **Imágenes de ejercicios 355/355**. **Alimentos con foto real 131/253** (Adobe Stock).

### Rediseño UX "Ethereal Glass" (member app)
- **Progreso** (`app/app/progress/page.tsx`): gráfico de evolución premium (SVG, área con
  degradado, gridlines min/máx, punto por check-in, último resaltado) + **mini-sparkline
  en cada KPI**.
- **Cardio** (`app/app/cardio/page.tsx`): **tira de actividad de 7 días**.
- **Descanso — pantalla NUEVA** (`app/app/recovery/page.tsx`): **índice de readiness**
  (anillo estilo Whoop calculado desde sueño + energía del último check-in), tarjeta de
  sueño, descanso/deload con señales de alarma, rutina de movilidad y recuperación activa.
  Cableada en nav (`components/member-mobile-header.tsx`, `lib/data.ts`, `mobile-tab-bar`).
  Se añadió `sleepQuality` al resumen de check-in (`lib/repositories/checkin-management.ts`).
- **Ajustes/Perfil** (`app/app/profile/page.tsx`): hero personalizado (avatar + nombre +
  plan/objetivo) + **toggles de notificación REALES y persistentes** (6 switches
  accesibles). Tabla nueva `member_notification_preferences` +
  `lib/repositories/notification-preferences.ts` + acción en `app/app/profile/actions.ts`.

### A11y / ergonomía transversal
- **`inputMode` numérico** añadido a ~51 inputs `type="number"` (member + coach + console)
  → teclado correcto en móvil.
- **`NavLink`** (`components/nav-link.tsx`): `aria-current="page"` en el activo (afecta a
  toda la nav).

### Sección Coach (mejoras reales)
- **Feedback de acciones** (`SubmitButton` + `successToast`) en 6 flujos: revisión de
  check-in, crear miembro, asignar planes, publicar guía, responder soporte.
- **Borrados con confirmación** (diálogo) en alimentos, suplementos, posts de comunidad,
  comidas de plantilla y ejercicios de programa. Se añadió prop `triggerAriaLabel` a
  `components/dialog.tsx`.
- **Miembros** (`app/coach/members/page.tsx` + nuevo `components/coach/members-explorer.tsx`):
  **buscador + filtro** (nombre/email/estado), contador, estado "Sin resultados", accesos
  rápidos a Mensajes/Check-ins por tarjeta.
- `aria-label` en botón de enviar mensaje; label honesto "Crear miembro"; tildes.

### Infra de pagos que YA EXISTÍA antes de esta sesión (importante)
- `lib/stripe/client.ts` — cliente REST propio (sin SDK). Soporta header
  `Stripe-Account` (4º arg de `stripeRequest`), Connect OAuth, verificación de firma de
  webhook. ⚠️ `createPlatformCheckoutSession` es **solo plataforma** (no acepta
  `stripeAccount` ni fee).
- `lib/stripe/env.ts` — flags + `applicationFeePercent` (default 25).
- `lib/repositories/stripe-billing.ts` — `stripe_accounts`, `platform_subscriptions`,
  `stripe_webhook_events` (idempotencia). `getStripeAccount`, `findWorkspaceByStripeAccount`,
  `recordWebhookEvent`, `upsertPlatformSubscription`.
- `app/api/stripe/{connect,connect/callback,webhook}/route.ts`.
- `app/coach/billing/page.tsx` — **real** (alta Connect, suscripción de plataforma, planes).
- `lib/repositories/coach-plans.ts` — `listCoachPlans / createCoachPlan / archiveCoachPlan`
  (tabla `coach_client_plans`). **NO existe `getCoachPlan`** (hay que crearlo).
- Migraciones `20260530140000_stripe_billing.sql`, `20260530150000_coach_client_plans.sql`.

---

## 3. Lo que está A MEDIAS / detenido

### Fase 1 — Motor del 25% (member → coach)  🟡 CONSTRUIDA, SIN VERIFICAR
El agente la completó y **commiteó** en la rama:
- `5f7dc27` migración member→coach Connect + ledger de comisiones
- `7efa006` repo `member-subscriptions` + `getCoachPlan`
- `ea399cc` helper de checkout conectado + `createMemberCheckout`
- `d186e45` webhooks de suscripción de miembro (cuentas conectadas)
- `75f8a62` enlace de pago de prueba por plan en `app/coach/billing`

Ficheros nuevos: `lib/repositories/member-subscriptions.ts`, `lib/stripe/member-checkout.ts`,
`supabase/migrations/20260531230000_member_billing_connect.sql`. **`pnpm typecheck` VERDE.**

⚠️ **Falta verificar (PRIMER trabajo de la nueva sesión):**
1. **Aplicar la migración** `20260531230000_member_billing_connect.sql` (Supabase project
   `gsfzigayzqhzbtrmmiqq`, MCP `apply_migration`) — parece **NO aplicada** (la tabla
   `platform_fee_events` no estaba en el schema). Revisar el fichero antes de aplicar.
2. **Revisar el código contra el spec de §5**: que `application_fee_percent` se envía de
   verdad, que el webhook **ramifica por `event.account`** sin romper el path de plataforma,
   y que NO se crean miembros sin pago confirmado.
3. **`pnpm build`** + prueba E2E en TEST (§6). El CEO reportó el agente "bugeado" en
   segundo plano → confirmar que no hay regresión (typecheck salió verde; revisar build y
   comportamiento real).

Nota: hasta esta sesión el 25% era **solo texto** (0% en código) y `member_subscriptions`
estaba muerta. Ahora el motor existe; **hay que validarlo end-to-end**. Cuidado: hay un
`subscription_status:"active"` hardcodeado en `lib/auth/member-access.ts` (gating demo) —
no romperlo.

---

## 4. Roadmap — lo que falta por construir (por fases)

| Fase | Qué | Estado |
|---|---|---|
| **1 · Motor del 25%** (member→coach: checkout Connect + `member_subscriptions` + webhooks de miembro + ledger de comisiones) | 🟡 Construida y commiteada, **sin verificar** — aplicar migración + revisar (§3/§5) |
| **2 · Página de venta por coach** (pública, resuelta por host, estilo rubengomezelite.com: hero de marca + planes `coach_client_plans` + checkout) + **funnel de alta de pago** (hoy el alta es solo-invitación, `shouldCreateUser:false`) | ⛔ Pendiente |
| **3 · Dominios propios** (alta en Vercel por workspace vía API/MCP + verificación + `middleware.ts` que valide host y bloquee fallback + wildcard `*.performlabs.app`) | ⛔ Pendiente |
| **4 · Cesión white-label (handover)**: asistente "coach compra → provisiona workspace → rol `coach_admin` → Connect → marca → dominio → publicar" | ⛔ Pendiente |
| **5 · Billing de consola PerformLabs**: reporting real de ingresos/MRR/comisión 25% desde el ledger (hoy `app/console/billing` es catálogo local sin Stripe) | ⛔ Pendiente |

### Cross-cutting / endurecimiento producción
- Cerrar el **modo demo** (`localOpenSession` → `platform_owner` sin auth).
- Blindar el **fallback brand** en hosts desconocidos (hard-fail/redirect en vez de servir).
- Confirmar que el **endpoint de webhook de Stripe escucha eventos de cuentas CONNECTED**
  (`event.account` presente) además de los de plataforma.

### Pendientes varios
- **122 fotos de alimento** restantes (bloqueadas por cuota de Adobe Stock; reanudar al
  reabrir cuota o subir plan; mientras, muestran icono limpio).
- **Densidad de la consola coach**: el CEO pidió compactar Entreno/Nutrición y en general
  las páginas (cards verticales → mucho scroll). Plan acordado: bloque CSS **scopeado a
  `.shell--coach`** en `globals.css` reduciendo `.grid` gap (20→12), `.card` padding
  (24→16), `.sectionHeader` margin-bottom (18→10), tamaños de `h2`/`.metric strong`, y
  padding de `.list .row`. Sin tocar anchos `spanN`. (No llegó a aplicarse.)

---

## 5. Spec de la Fase 1 (CRÍTICO — usar para REVISAR lo construido)

La Fase 1 ya está codeada (§3). Durante la sesión hubo lecturas corruptas, así que estos
hechos **verificados** sirven para **auditar** que la implementación del agente es correcta
(o reconstruir lo que no encaje):

1. **`createPlatformCheckoutSession(opts)`** firma real:
   `{ workspaceId, priceId, successUrl, cancelUrl, customerId?, customerEmail? }`.
   **NO acepta `stripeAccount` ni `applicationFeePercent`.** Es solo para la suscripción
   coach→PerformLabs. **No reutilizar para el miembro.**
2. **Building block correcto:** `stripeRequest(method, path, params, { stripeAccount?, idempotencyKey? })`
   en `lib/stripe/client.ts` **sí** soporta el header `Stripe-Account`. Crear un nuevo
   `createConnectedCheckoutSession(opts, { stripeAccount })` que llame a
   `stripeRequest("POST", "/checkout/sessions", params, { stripeAccount })` con claves
   aplanadas: `mode:"subscription"`, `"line_items[0][price]"`, `"line_items[0][quantity]":1`,
   `success_url`, `cancel_url`, `customer_email`, `client_reference_id`,
   `"subscription_data[application_fee_percent]": getStripeEnv().applicationFeePercent`,
   y metadata en `"metadata[kind|workspace_id|coach_client_plan_id|member_profile_id]"`
   **y** `"subscription_data[metadata][...]"` (kind = `"member_subscription"`).
3. **`coach-plans.ts`** no tiene `getCoachPlan`: añádelo (select por id). Campos de
   `CoachPlan`: `{ id, workspaceId, name, amountCents, currency, interval, stripePriceId, active }`.
   El precio para el checkout es `stripePriceId`.
4. **Cuenta del coach:** `getStripeAccount(workspaceId)` → `{ stripeUserId, chargesEnabled, … }`
   (no `getStripeAccountByWorkspace`). `findWorkspaceByStripeAccount(stripeUserId)` mapea de
   vuelta.
5. **Webhook** (`app/api/stripe/webhook/route.ts`): el `handleEvent` actual maneja
   `account.updated`, `checkout.session.completed` (PLATAFORMA, sin `event.account`) y
   `customer.subscription.updated|deleted` (plataforma). Los eventos de **miembro llegan con
   `event.account` presente** y `metadata.kind === "member_subscription"`. **Ramificar:** si
   `event.account` → ruta de miembro; si no → dejar la ruta de plataforma EXACTA. Manejar
   `checkout.session.completed`, `customer.subscription.created|updated|deleted`,
   `invoice.paid`, `invoice.payment_failed`. Leer del payload; si hay que recuperar un objeto
   de una cuenta conectada, pasar `{ stripeAccount: event.account }`.

### Modelo de datos a crear (migración aditiva, RLS service-role como `20260530140000_stripe_billing.sql`)
- `member_profiles`: `+ stripe_customer_id text`.
- `member_subscriptions` (existe, activarla): `+ workspace_id, coach_client_plan_id,
  stripe_account_id, stripe_price_id, application_fee_percent numeric, current_period_start,
  cancel_at_period_end bool, amount int, currency, updated_at` + **UNIQUE en
  `stripe_subscription_id`** (upsert).
- **`platform_fee_events`** (ledger nuevo): `id text pk` (= invoice id), `workspace_id,
  member_profile_id, stripe_account_id, stripe_subscription_id, amount_total,
  application_fee_amount, currency, status, created_at`.
- `member_profiles.subscription_status` (enum `trialing|active|past_due|paused|cancelled|expired`)
  debe pasar a **dictarse por webhook**. **No romper** el gating demo/preview en
  `lib/auth/member-access.ts`.
- Nuevo repo `lib/repositories/member-subscriptions.ts` (espejo de `stripe-billing.ts`):
  `upsertMemberSubscription`, `getMemberSubscriptionByMember`, `setMemberStripeCustomer`,
  `setMemberSubscriptionStatus`, `recordPlatformFeeEvent` (idempotente).
- Entrada de checkout: `lib/stripe/member-checkout.ts` `createMemberCheckout(...)` + acción
  `createMemberCheckoutLinkAction` en `app/coach/billing/actions.ts` (+ botón de prueba en
  `app/coach/billing/page.tsx` solo si `chargesEnabled`).

**"25% vitalicio":** `application_fee_percent` se fija al crear la suscripción y persiste en
Stripe toda su vida; guardarlo también en `member_subscriptions`. Connect **Standard** ya
soporta esto (no migrar tipo de cuenta).

---

## 6. Lo único que necesita el CEO (humano)
- Para el **E2E con tarjeta de prueba**: claves de **TEST** de Stripe (`sk_test_…`,
  `pk_test_…`, `STRIPE_WEBHOOK_SECRET` de test, `STRIPE_PLATFORM_PRICE_ID` de test) puestas
  **solo en el entorno Preview** de Vercel (Producción sigue en live, intacta).
- Confirmar/añadir en el dashboard de Stripe que el **webhook recibe eventos de cuentas
  conectadas**.
- Más adelante: los **dominios reales** de cada coach para conectarlos en Vercel.

Todo lo demás (código, migraciones vía Supabase MCP, productos/precios de test vía Stripe
MCP, dominios vía Vercel MCP) se puede hacer de forma autónoma con los MCPs conectados.

---

## 7. Comandos y primeros pasos para la nueva sesión
```bash
pnpm install
pnpm typecheck   # next typegen && tsc --noEmit  (debe quedar verde)
pnpm build       # validar UI amplia
pnpm dev         # localhost:3000
```
1. `git checkout claude/keen-ramanujan-X9vqU && git pull`.
2. Revisar este `handoff.md` y el PR #73.
3. Decidir arranque (recomendado: **Fase 1** con el spec de §5, en test).
4. Aplicar migraciones con el MCP de Supabase (project `gsfzigayzqhzbtrmmiqq`) y verificar.
5. Mantener `pnpm typecheck` verde y abrir/actualizar PR en draft tras push.

## 8. MCPs disponibles
Supabase, Stripe, Vercel, GitHub, Figma, Adobe Express, Cloudinary, nanobanana, Airtable,
Gmail, Google Calendar/Drive, Semrush, Hugging Face, Descript, ui-ux-pro, stitch.
Buscar con `ToolSearch` cuando encajen (regla #1 de `CLAUDE.md`: usar siempre las tools/MCP).
