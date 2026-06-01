# CLAUDE.md — Guía operativa para agentes en PerformLabs

> Plataforma white-label de coaching de fitness. 3 superficies en un mismo sistema:
> **member app `/app`**, **coach `/coach`**, **consola interna `/console`** + landing
> pública. Next.js (App Router) · React · TypeScript · Supabase · CSS global como
> design system · Lucide. Lee también `PRODUCT.md` (principios y objetivo WCAG AA) y
> el knowledge base en `brain/`.
>
> **🗣️ Idioma — habla SIEMPRE en español** con el equipo (chat, resúmenes,
> explicaciones y preguntas), en todas las sesiones. Petición expresa del CEO. El
> código, los nombres de símbolos y los mensajes de commit siguen las convenciones
> del repo; el texto dirigido a la persona va en español salvo que pidan otro idioma.

---

## 0. REGLA #1 — Usa SIEMPRE las herramientas y los MCP disponibles

**No trabajes "de memoria" cuando hay una herramienta o un MCP que lo hace mejor.**
Antes de afirmar que algo no se puede, busca la tool (`ToolSearch`). Esta es una
instrucción permanente del CEO para todas las sesiones de este repo.

| Tarea | Usa |
|-------|-----|
| Diseño, UI/UX, sistemas de diseño, a11y, paletas, tipografía, patrones, iconos | **MCP `ui-ux-pro`** (`search_all`, `search_patterns`, `get_design_system`, `search_styles`, `search_stack`) |
| Generar/mockear pantallas o componentes, design-to-code, sync con Figma | **MCP `stitch`** y **MCP Figma** (`get_design_context`, `use_figma`) |
| Imágenes/edición/branding/assets | **MCP Adobe Express**, **MCP nanobanana**, **MCP Cloudinary** |
| Base de datos, migraciones, RLS, logs, advisors, tipos TS | **MCP Supabase** (`list_tables`, `apply_migration`, `get_advisors`, `get_logs`) |
| Deploys, logs de runtime/build, dominios | **MCP Vercel** |
| Pagos, Connect, productos, precios, webhooks | **MCP Stripe** |
| PRs, issues, reviews, CI | **MCP GitHub** (`mcp__github__*`) — no hay `gh` CLI |
| Buscar en el código / multi-archivo | subagentes `Explore` / `general-purpose`, `Grep`, `Glob` |
| Investigación web / docs | `WebSearch`, `WebFetch`, skill `deep-research` |

Otros MCP conectados y disponibles: Airtable, Gmail, Google Calendar, Google Drive,
Semrush, Hugging Face, Descript. Búscalos con `ToolSearch` cuando encajen.

**Patrón:** cuando una petición pueda servirse por un MCP (aunque no lo nombren),
llama a `ToolSearch` con una keyword y úsalo. Apóyate en `ui-ux-pro` para respaldar
decisiones de diseño con criterio externo, no solo opinión.

---

## 1. Sistema de diseño

- Lenguaje **"Ethereal Glass"** sobre fondo casi-OLED `#080909`, un acento azul
  `#078df2` (cada coach lo sobreescribe vía `--accent`).
- **Todo el design system vive en `app/globals.css`** (tokens + clases globales). Los
  primitivos en `components/ui/*` (`Button`, `Card`, `Field`, `Table`, `Badge`,
  `Stat`, `EmptyState`) son envoltorios finos de esas clases. En páginas nuevas y
  a11y-críticas prefiere los primitivos (sobre todo `Table` y `Field`).
- Tipografía: **Geist** (UI), **Bricolage Grotesque** (display), **Geist Mono** (números).
- Utilidades premium: `.uiGlass`, `.uiSheen`, `.uiAccentCard`, `.uiIconChip`,
  `.uiStat`, `.uiMeta`, `.uiFadeUp` (`globals.css:645-753`).
- Filosofía: la **landing respira** (wow), la **consola/coach es herramienta densa**
  (Linear/Stripe). Ver `brain/Sistema de diseño.md`.

## 2. Accesibilidad (objetivo WCAG 2.1 AA — innegociable)

- Foco visible (`:focus-visible` global), contraste ≥4.5:1, labels reales, teclado y
  `prefers-reduced-motion` respetado.
- Checklist al tocar UI: tablas con `scope="col"`; mensajes de estado con
  `role="alert"`/`status`; inputs con `autoComplete` + tipo correcto + `inputMode` en
  numéricos; iconos decorativos `aria-hidden`; botones-icono con `aria-label`; tap
  targets ≥24px (≥44px móvil).
- Estado y roadmap de a11y/UX: **`docs/ux-audit-2026.md`**.

## 3. Reglas de cambio

- **No romper server actions ni endpoints**: el rediseño es de presentación
  (principio 5 de `PRODUCT.md`).
- Rama de trabajo indicada por la tarea; **nunca** push directo a `main` sin permiso.
- Cada cambio entra con `pnpm typecheck` en verde (y `pnpm build` cuando toca UI amplia).
- Tras push, abre **PR en draft** si no existe.

## 4. Comandos

```bash
pnpm install
pnpm dev          # localhost:3000
pnpm typecheck    # next typegen && tsc --noEmit
pnpm lint
pnpm test         # vitest
pnpm build
```

## 5. Mapa rápido

- `app/` rutas (App Router): `app/app/*` member · `app/coach/*` · `app/console/*` ·
  landing `app/page.tsx` · acceso `app/login|registro|acceso|m`.
- `components/` UI compartida (`components/ui/*` primitivos).
- `lib/` repositorios, brand, i18n, supabase.
- `brain/` knowledge base (decisiones, roadmap, diseño). `docs/` estrategia y audits.
