# Handoff — PerformLabs a nivel élite (2026-06-02)

> **Cómo usar este documento (PRIORIDAD).** Esta es la guía maestra para la siguiente
> sesión. **Antes de tocar nada**, lee `CLAUDE.md`, `PRODUCT.md`,
> `docs/strategy/macroactive-competitive-and-elite-roadmap.md` y este handoff. Y usa las
> **skills instaladas** (sección 1) como herramienta de primera elección — no trabajes "de
> memoria" si hay una skill o un MCP que lo hace mejor (regla #1 de `CLAUDE.md`).

---

## 1. Skills a usar (por tarea) — ÚSALAS

Están instaladas; invócalas con la skill correspondiente según la tarea.

### Desarrollo
- **composition-patterns**, **react-best-practices** → al construir/editar cualquier UI o
  componente (member app, consola, landing del coach). Componentes server/client, props,
  estado, accesibilidad.
- **supabase-postgres-best-practices** → migraciones, RLS, índices, repos. (Ej: la tabla
  `coach_inquiries` de esta sesión; futuras tablas de hábitos/periodo/comunidad.)
- **test-driven-development** → toda feature nueva entra con tests (extrae lógica pura y
  table-testéala, como se hizo con billing/retención/parseRatio).
- **systematic-debugging** → fallos de CI, bugs de runtime, regresiones.
- **subagent-driven-development** → tareas grandes: divídelas y delega en subagentes.
- **claude-api** → al tocar la IA (coach-chat / "nutrition agent"); incluir prompt caching.

### Diseño
- **ui-ux-pro-max**, **frontend-design**, **web-design-guidelines** → respaldan TODA
  decisión de UI/UX/a11y (la landing élite, la member app). Sustituyen/complementan al MCP
  `ui-ux-pro`.
- **theme-factory** → el sistema de marca por coach (`--accent`/`--sales-bg`,
  parametrización white-label). Clave para que cada coach tenga "su" sitio.
- **brand-guidelines** → coherencia con "Ethereal Glass" (fondo casi-OLED, acento, Geist /
  Bricolage Grotesque / Geist Mono).

### Arquitectura
- **memory-systems**, **context-optimization**, **filesystem-context** → mantener este
  handoff y el knowledge base (`brain/`, `docs/`) al día; organizar el contexto de sesiones
  largas; no recargar el contexto con archivos enteros (usa subagentes Explore).

### Agentes
- **dispatching-parallel-agents**, **multi-agent-patterns** → paralelizar auditorías y
  features independientes (como los 4 agentes de la sesión de remediación).
- **hosted-agents** → si se automatizan flujos (watch de PRs, crons).
- **mcp-builder** → si hay que construir un MCP propio (p.ej. para el pipeline de tiendas).

---

## 2. Estado: PRs abiertos (todos verdes en local; CI por confirmar)

Mergear en este orden. Tras mergear, **reconciliar** posibles choques en `app/globals.css`
y `lib/supabase/database.types.ts` (las ramas independientes salieron de `main`).

| PR | Rama | Qué | Estado |
|----|------|-----|--------|
| **#80** | `claude/gifted-einstein-1nm5w` | Remediación auditoría: **seguridad completa** (L1–L4, M4, M5) · type-safety (≈190 `as any`) · DB hygiene (`unaccent`) · dedup (`isUuid`→`lib/utils/uuid`, `DAY_MS`→`lib/utils/dates`) · A6 `parseRatio` · B5 `coach-chat` · tests money-path + access. **124 tests** | **Ready** — mergear 1º |
| **#81** | `claude/member-progress-photos` | Fotos del miembro en `/app/progress` + **fix de privacidad** (progress/recovery eran workspace-scoped → ahora member-scoped) | Draft, contiene #80 — mergear tras #80 |
| **#82** | `claude/compact-workout-cards` | Cards de entreno (status + plan semanal) en **carrusel horizontal** ≤980px (mata el scroll móvil) | Draft, desde `main` — independiente |
| **#83** | `claude/coach-elite-sales-landing` | **Fase Comercial**: doc de estrategia + **landing de ventas élite** del coach (`/c/[slug]`) con mockups (`ScreensGallery`) + animaciones (`MotionReveal`) + glow, página de **gracias**, **Contacto** y **1-1 Coaching** (tabla `coach_inquiries`, RLS deny-all, migración **ya aplicada a prod**), nav multi-página | Draft, desde `main` — independiente |

> La landing del coach se prueba en `…/c/marca-blanca-fitness` (+ `/contacto`, `/1-1-coaching`).
> El demo no tiene `heroImageUrl`/`welcomeMessage`, por eso su hero es solo degradado+glow:
> un coach real con foto llena el hero y el "sobre mí".

---

## 3. Roadmap restante (fase a fase)

### Fase 2 — Tiendas (app en App Store / Google Play)
El gran diferenciador de MacroActive. Confirmado por ellos: la PWA es la base y la app
nativa es un **upgrade**.
- **Código (se puede hacer ya):** PWA robusta (service worker + manifest completo + meta
  `apple-mobile-web-app-*`), scaffolding **TWA** (Android) y **Capacitor** (iOS), pipeline
  de build branded por coach (icono/nombre/splash/`--accent`).
- **Bloqueo humano:** publicar requiere cuenta **Apple Developer** ($99/año, idealmente del
  coach por guideline 4.2.6/4.3) y **Google Play** ($25 único). Ver §4 del doc de estrategia.

### Fase 3 — Paridad de producto (código puro, sin bloqueos)
Cierra la brecha con MacroActive/rubengomezelite:
- **Member app:** registro de **hábitos**, registro de **periodo** (ya existe `app/app/cycle`
  + tabla `member_cycle_logs` — completar), **comunidad** real (hoy roadmap).
- **Consola coach:** **Bulk Video Uploader**, **Lesiones**, **Knowledge Base**.
- **Notificaciones:** canales in_app/email reales (hoy solo push live); segmentos de audiencia.

### Fase 4 — Diferenciación + robustez
- **IA**: coach-chat / "nutrition agent" como ventaja (usa skill `claude-api`, con caching).
- **Observabilidad (B6)**: `@sentry/nextjs` + `lib/log.ts` (78 `console.error` sueltos). Necesita DSN.
- **Performance** y pulido.

### Deuda técnica pendiente (del handoff anterior, no abordada)
- **B4** god-modules split (`training-management` 1413 LOC, etc.), **globals.css split**
  (14k+ líneas → partials + stylelint), **B7** componentes duplicados.
- **A8** test que fije los paths de Stripe (`current_period_end`/`items`) antes de subir versión.
- **M4 (reproducibilidad)** reconciliar timestamps de migraciones repo vs prod.
- Más tests: `provisionPaidMember`, `requireWorkspaceMutationAccess`, fee idempotency.

---

## 4. Acciones humanas pendientes (no son código)

- **Mergear los PRs** (#80 → #81; #82 y #83 cuando quieras) y reconciliar conflictos.
- **Rotar** la `sk_test` y el `whsec` de Stripe que se compartieron en chat.
- **Env vars en Vercel:** VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_CONTACT`), `CRON_SECRET`, y `VERCEL_API_TOKEN`/`VERCEL_PROJECT_ID`/`VERCEL_TEAM_ID`
  para el alta de dominios. (Verifica las que ya pusiste.)
- **Landing del coach:** subir **foto** (`heroImageUrl`) + **bio** (`welcomeMessage`) por
  workspace para que hero + "sobre mí" se llenen. Decidir si poner placeholder en la demo.
- **Fase 2:** abrir cuentas Apple Developer + Google Play cuando toque.
- **Ya hecho por ti:** Captcha **OFF** (la app no integra hCaptcha), política de contraseña
  **12 chars**. *Leaked-password protection* sigue OFF (es de plan **Pro**; riesgo aceptado,
  mitigado con política fuerte + auth passwordless de miembros).

---

## 5. Contexto clave

- **Producción Supabase** = `gsfzigayzqhzbtrmmiqq` · **Vercel** `perform-labs-pcgg`.
- **Arquitectura:** Next.js App Router · 3 superficies (`/app` member · `/coach` · `/console`)
  + landing pública `app/page.tsx` (capta coaches, B2B) + sitio de ventas del coach
  `/c/[slug]` (capta clientes, B2C). Multi-tenant por workspace + branding + dominios custom.
  Stripe Connect con `application_fee_percent` (revenue-share). Datos vía **service role**
  (RLS deny-all en tablas internas = postura correcta, no bug).
- **El "juego" (ver doc de estrategia):** PerformLabs = un **MacroActive** propio. Hueco de
  mercado: coaches **< $10k/mes** que MacroActive (élite) no atiende.
- **Componentes reutilizables clave:** `components/landing/screens-gallery.tsx` (mockups de
  la app, reskinean con `--accent`), `components/motion-reveal.tsx` (`MotionReveal`/`SmoothScroll`),
  el bloque `.sales*` y `.gal*` en `globals.css`.

## 6. Comandos / gates
`pnpm install` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`. CI (`validate`)
corre solo en PRs hacia `main`. **Todo cambio entra con typecheck + test + build en verde** y
PR en draft.
