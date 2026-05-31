# Auditoría UI/UX PerformLabs — 2026-05-31

> Repaso completo y real de las **3 superficies** (member `/app`, `/coach`, `/console`)
> + landing pública y flujos de acceso. Objetivo: **moderno, accesible (WCAG 2.1 AA)
> y con mucho "wow" desde el segundo 1**, sin romper server actions ni endpoints
> (principio 5 de `PRODUCT.md`).
>
> Método: lectura directa de la fundación (`app/globals.css`, primitivos
> `components/ui/*`), de las páginas "segundo 1" (landing, login, registro, acceso,
> `/m`, dashboard de miembro) y barrido cuantitativo con `grep` sobre las 69
> `page.tsx`. Las correcciones marcadas **[HECHO]** ya están aplicadas en esta pasada.

---

## 1. Resumen ejecutivo

PerformLabs tiene una **fundación de diseño sólida y poco común de ver**: sistema de
tokens consciente de contraste (`--text-muted` ya elevado para AA, `globals.css:15`),
`:focus-visible` global (`globals.css:96`), skip-link, scrollbar premium,
`prefers-reduced-motion` respetado, y una capa de utilidades "Ethereal Glass"
(`.uiGlass`, `.uiSheen`, `.uiIconChip`, `.uiStat`, `.uiFadeUp`, `globals.css:645-753`).
Los primitivos (`Button`, `Card`, `Field`, `Table`, `Badge`, `Stat`) están limpios y
con buen cableado de accesibilidad (`Field` asocia `label`+`aria-invalid`+`aria-describedby`).

La **landing y la member app** ya recibieron un uplift premium real (aurora, grain,
phone 3D, galería deslizable, motion reveals, rings tipo Whoop). La **consola y el
coach** siguen la filosofía correcta de "densidad legible" (Linear/Stripe).

Los problemas no son de visión, son de **terminación y consistencia**: huecos
sistémicos de accesibilidad, falta de estados de carga en coach, vacíos bespoke, y
deuda creciente en `globals.css` (13.171 líneas, crecido por capas de agente).

**Estado de salud:** `pnpm typecheck` en verde antes y después de esta pasada.

---

## 2. Hallazgos transversales (cross-cutting)

| # | Hallazgo | Evidencia | Severidad | Estado |
|---|----------|-----------|-----------|--------|
| C1 | Tablas sin `scope="col"` en cabeceras (lectores de pantalla no asocian columna) | `scope=` aparecía **0 veces** en todo el repo; primitivo `Table` + 2 tablas crudas (`console/members`, `console/billing`) | Alta (A11Y) | **[HECHO]** |
| C2 | Mensajes de estado de formulario sin live region | `formMessage` ×8, `role="alert"`/`aria-live` ×3; auth renderiza `?error=`/`?success=` como `<p>` estático tras `redirect` | Media (A11Y) | **[HECHO]** en auth (login, registro, acceso, `/m`) |
| C3 | Inputs sin `autoComplete` ni tipo correcto | 268 inputs reales (521 − 253 hidden), solo 6 con `autoComplete`; `login` no lo tenía y `acceso` sí (inconsistencia) | Media (UX/A11Y) | **[HECHO]** en login, registro, lead form de landing |
| C4 | `<select>` inline en tabla sin label asociado | `console/members/page.tsx:123,129` | Media (A11Y) | **[HECHO]** (`aria-label` por fila) |
| C5 | Iconos decorativos sin `aria-hidden` | `EmptyState` (`empty-state.tsx`) y varios glifos | Baja (A11Y) | **[HECHO]** en `EmptyState`; resto pendiente |
| C6 | **Coach sin `loading.tsx`** → sin skeletons en navegación | `app/coach`: **0** loading.tsx en 20 páginas (vs console 5, app 1 raíz) | Media (WOW/perf percibida) | Pendiente |
| C7 | `inputMode` ausente en campos numéricos | `type="number"` ×55, `inputMode` ×6 (kg/reps/kcal abren teclado equivocado en móvil) | Baja (UX móvil) | Pendiente |
| C8 | Cobertura de `aria-label` en botones-icono | 164 `<button>`, 24 con `aria-label`; muchos son texto, pero hay botones-icono sin label | Media (A11Y) | Pendiente (revisión página a página) |
| C9 | Primitivos `@/components/ui` infrautilizados a nivel de página | Import en 1/20 (app), 2/20 (coach), 2/22 (console); +320 `className="card"` crudos | Baja (consistencia/drift) | Pendiente (estrategia) |
| C10 | `globals.css` con deuda estructural | 13.171 líneas; secciones "UI UPLIFT A/B/C", "(agent)" duplicadas/aparcadas | Media (mantenibilidad) | Pendiente (consolidación) |

> Nota C9: hoy la consistencia visual la sostiene el CSS global (los primitivos son
> envoltorios finos de `.card`/`.btn`/`.tag`/`.table`), por eso "se ve igual". El
> riesgo es que una mejora de a11y en un primitivo **no cascada** a las páginas que
> usan la clase cruda — por eso en C1 hubo que arreglar también las 2 tablas crudas.

---

## 3. Por superficie

### 3.1 Pública + Acceso (el "segundo 1")

**Landing `app/page.tsx`** — Fuerte. Hero con `auroraField` + `grain` + `PhoneBuild`
3D + `MotionReveal`, bento de capacidades, proceso numerado, galería deslizable, FAQ,
lead form y footer. Jerarquía `h1→h2→h3` correcta; CTAs claras; trust signals.
- ✅ Fortalezas: identidad premium real, motion con reduced-motion, `aria-hidden` en
  capas decorativas (`page.tsx:53-54,98`).
- ⚠️ Mejoras: lead form sin `autoComplete`/tipos **[HECHO]** (`page.tsx:177-181`);
  la CTA primaria del hero es un `<a>` con clase `.btn` (ok, es ancla a `#consulta`).
- 💡 WOW pendiente: llevar el ambiente `aurora`/`grain` también a `login`/`registro`
  para una primera impresión coherente al pasar de landing → acceso.

**Login `app/login/page.tsx`** vs **Acceso `app/acceso/page.tsx`** vs **`/m`**:
- `login` carecía de `autoComplete` y de Google sign-in que sí tienen `acceso` y `/m`
  (inconsistencia). `autoComplete`+`role` **[HECHO]**. Decisión pendiente: ¿login de
  consola debería ofrecer Google también?
- Mensajes de error de `redirect` ahora con `role="alert"`/`status` **[HECHO]**.

**`app/gracias`, `app/registro`** — coherentes con el lenguaje `authPanel`/`authAside`.

### 3.2 Member app `/app` (20 páginas)

- ✅ Dashboard `app/app/page.tsx` ya premium: `uiGlass uiSheen uiFadeUp`,
  `progressbar` con `aria-valuenow/min/max` (`page.tsx:91`), hábitos con `aria-label`
  en el toggle (`page.tsx:120`). `mobile-tab-bar.tsx` con `aria-label` + `aria-current`.
- ⚠️ **0 uso de `EmptyState`** en las 20 páginas → vacíos bespoke (inconsistentes).
- ⚠️ Solo 1 `loading.tsx` (raíz) → las vistas de datos pesados (meals, progress,
  recipes) no tienen skeleton propio.
- 🔍 Pendiente de revisión profunda: logging de entreno (reps/kg/RIR/RPE) y diario
  nutricional para `inputMode="decimal"`/`numeric` y tap targets ≥44px en móvil.

### 3.3 Coach `/coach` (20 páginas)

- ✅ `<Topbar>` en 20/20 → orientación consistente. Chrome (`sidebar`, `topbar`,
  `command-palette`) correcto.
- ⚠️ **0 `loading.tsx`** en toda la superficie → en cada navegación se ve salto en
  vez de skeleton. Es el hueco de "perceived performance" más claro de la plataforma.
- 🔍 Pendiente: auditar densidad/escaneo de `members`, `nutrition`, `programs`,
  `checkins` y empty states que enseñen.

### 3.4 Consola `/console` (22 páginas)

- ✅ Mejor cobertura de `EmptyState` (8/22) y `loading.tsx` (5). `<Topbar>` 22/22.
- ⚠️ 2 tablas crudas (`members`, `billing`) — `scope` + labels **[HECHO]**.
- 🔍 Pendiente: revisar formularios largos colapsables y densidad por página
  (ya iniciado en el rediseño 2026-05-30 según `brain/Sistema de diseño.md`).

---

## 4. Roadmap priorizado

**P0 — Fundación de accesibilidad (HECHO en esta pasada)**
`scope` en tablas (C1), live regions en auth (C2), `autoComplete`+tipos en
auth/lead (C3), labels en selects de tabla (C4), `aria-hidden` en `EmptyState` (C5).

**P1 — Wow + percepción (siguiente)**
1. `loading.tsx` con skeletons para `/coach` (y vistas de datos de `/app`). (C6)
2. Ambiente `aurora`/`grain` coherente en `login`/`registro` (primera impresión).
3. `EmptyState` unificado en la member app (sustituir vacíos bespoke). (C5)

**P2 — Consistencia y deuda**
4. `inputMode` en numéricos de logging/diario. (C7)
5. Barrido de `aria-label` en botones-icono. (C8)
6. Estrategia de primitivos: usar `<Table>`/`<Field>` (a11y-críticos) en páginas
   nuevas; documentar en `components/ui/README.md`. (C9)
7. Consolidar `globals.css`: deduplicar secciones "(agent)"/"UI UPLIFT". (C10)

**P3 — Profundización por superficie (con dirección del CEO)**
Deep-dive de densidad/escaneo en coach (`members`/`nutrition`/`programs`) y pulido
de logging de entreno y diario nutricional en `/app`.

---

## 5. Principios de trabajo

- **Usar siempre las herramientas y MCP disponibles** (ver `CLAUDE.md`): `ui-ux-pro`
  para benchmarks/a11y, `stitch`/Figma para diseño, Supabase/Vercel/Stripe para datos
  e infra, GitHub para PRs.
- No romper server actions ni endpoints: el rediseño es de **presentación**.
- Cada cambio entra con `pnpm typecheck` (y build cuando toca) en verde.
