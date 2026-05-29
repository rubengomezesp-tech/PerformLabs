# Auditoría integral PerformLabs vs Macroactive + veredicto

Estado real del proyecto (rutas, repos, 70+ tablas, infra) comparado con
Macroactive (ver `docs/inspiration/`). Leyenda: ✅ a la par · 🟢 por delante ·
🟡 parcial · ⛔ falta.

## Resumen ejecutivo
PerformLabs **ya iguala** a Macroactive en el núcleo (fitness, nutrición, app del
miembro, branding) y **le supera** en IA, stack moderno (PWA), white-label y modelo
de negocio (socio a éxito + consola de agencia). Para ser "plataforma grande y
seria que le supera", faltan **pagos en vivo (Stripe Connect)**, **comunidad +
chat en tiempo real**, **push real**, **app nativa** y **trackers/escáner**.

## Matriz de features
| Módulo | Macroactive | PerformLabs |
|---|---|---|
| Products / Pricing plans | ✅ | 🟡 modelo+UI (`pricing_plans`, `coupons`, `subscriptions`), sin cobro real |
| **Pagos Stripe / checkout** | ✅ | ⛔ **(el mayor hueco)** |
| Dashboard miembro | ✅ | ✅ nivel mockup (Mi Recorrido, hábitos, check-in) |
| Workouts + log + swaps + vídeo | ✅ | ✅ (incl. swap autoservicio) |
| Nutrición + recetas + meal plan | ✅ | ✅ |
| Food diary | ✅ | ✅ + 🟢 **Smart Add IA** (texto→macros) |
| Escáner código de barras | ✅ | ⛔ (lo cubre la IA en parte) |
| **Comunidad (feed)** | ✅ | ⛔ miembro (solo `/console/community` interno) |
| **Chat 1:1 tiempo real** | ✅ | 🟡 tickets async (`support_conversations`) |
| **Push notifications** | ✅ | 🟡 infra (`member_devices`, `app_messages`), sin cablear |
| Habit tracker | ✅ | ✅ (+ rachas) |
| Step / period trackers | ✅ | ⛔ (solo campo `daily_steps_target`) |
| My Journey (fotos) | ✅ | 🟡 (`progress_photos`, sin galería dedicada) |
| Branding / look & feel | ✅ | 🟢 **editable a fondo** (logo, colores, hero, bienvenida) + subdominio |
| Dominios propios | ✅ | 🟡 (`workspace_domains` + fallback subdominio) |
| **App nativa iOS/Android** | ✅ | ⛔ (PWA instalable) |
| Notificaciones email | ✅ | ✅ (`notification_templates`) |
| IA (generación/asistencia) | ⛔ | 🟢 **Smart Add, agente nutrición, plan auto** |
| Consola de agencia (CRM/proyectos/lanzamiento) | ⛔ | 🟢 (leads, projects, templates, launch, strategy) |
| Modelo de negocio | SaaS | 🟢 socio a éxito (25% + marketing) |

## Donde YA superamos a Macroactive
1. **IA nativa**: Smart Add (lenguaje natural→macros), agente de nutrición, y
   generación/asignación automática del plan al terminar el onboarding. Macroactive
   no tiene IA.
2. **Stack moderno**: Next.js + **PWA instalable**, error boundaries, **CI que
   aplica migraciones solo**.
3. **White-label profundo**: branding editable por entrenador + **subdominio
   `<marca>.performlabs.app`** + dominios propios.
4. **Capa de agencia**: leads → proyectos → lanzamiento → estrategia. Somos
   "done-for-you partner", no solo una herramienta.
5. **Modelo a éxito** (25% + acompañamiento de marketing) — incentivos alineados.

## Lo que FALTA para ser plataforma grande y seria (priorizado)
**P0 — Existencial (negocio)**
1. **Stripe Connect** (checkout + suscripciones + application fee 25%) — sin esto
   no hay ingresos reales ni el modelo. Diseño ya documentado.
2. **Funnel signup→pago→provisión** del cliente (hoy se provisiona a mano).

**P1 — Engagement/retención (lo que engancha)**
3. **Comunidad del miembro** (feed, posts, likes, moderación) — **Supabase Realtime** (sin dep nueva).
4. **Chat 1:1 en tiempo real** miembro↔coach (texto, archivos; voz después) — Supabase Realtime.
5. **Push notifications** reales: Web Push (VAPID) ahora; OneSignal/native después.

**P2 — Paridad de features premium**
6. **Trackers**: step (Health Connect/HealthKit en nativo), period, **My Journey** (galería de fotos en PWA).
7. **Escáner de comida** (cámara + OpenFoodFacts) + favoritos / treat meals / dining out.
8. **App nativa** (envolver la PWA con Capacitor → App Store/Play, push y wearables fiables).

**P3 — Pulido UX tangible (sensación premium)**
9. **Feedback de guardado** (toasts "✓") en consola y app.
10. Más **IA**: copiloto del coach, análisis de check-ins, asistente en el chat.
11. Polish: animaciones, estados vacíos guiados, onboarding con más "delight".

## Veredicto
- **Paridad de núcleo: alcanzada.** Fitness, nutrición, app del miembro y branding
  están a la altura o por encima.
- **Ventaja diferencial: ya la tenemos** (IA + PWA + white-label + agencia + modelo a éxito).
- **Para superarle de verdad y ser "grande y seria"**: cerrar **P0 (Stripe Connect)**
  → **P1 (comunidad + chat realtime + push)** → **P2 (trackers/escáner/nativa)**.
  Con P0+P1 hechos, PerformLabs es objetivamente más moderna y completa que Macroactive.

> Orden recomendado: **Stripe Connect** (desbloquea negocio) → **Comunidad + Chat
> realtime + Push** (engagement) → **Nativa + trackers + escáner** (paridad premium)
> → **pulido UX/IA** continuo.
