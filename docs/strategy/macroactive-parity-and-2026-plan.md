# Macroactive parity + plan 2026 (leapfrog)

Documento maestro que cruza el [knowledge base de Macroactive](../inspiration/macroactive-knowledge-base.md)
y el [manual autosuficiente](../inspiration/macroactive-manual-autosuficiente.md)
con lo que PerformLabs ya tiene, marca los gaps y prioriza el camino para
"acabarlo todo" a nivel 2026. Regla: no clonar — **superar** con IA nativa,
tiempo real y UX premium, usando las dependencias que ya tenemos siempre que
podamos antes de añadir nuevas.

Leyenda de estado: ✅ hecho · 🟡 parcial · ⛔ falta.

## 1. Oferta comercial (Products · Pricing · Stripe)

| Pieza Macroactive | PerformLabs | Notas |
| --- | --- | --- |
| Product Plans (meal+workout, solo meal, solo workout, page products) | 🟡 `/console/billing` | Falta el modelo Product Plan ↔ contenido entregado |
| Pricing Plans (recurring/one-off, ciclo, trial, activation, coupon) | ⛔ | Núcleo comercial pendiente |
| Stripe (checkout, refunds, coupons, failed payments, disputes, tax, Klarna) | ⛔ | Requiere `stripe` + `ANTHROPIC`-libre; claves server |
| One-Time Offer / upsell post-pago | ⛔ | |
| Billing Information (miembro) | ⛔ | Página de facturación del miembro |
| Self-service plan change (upgrade/downgrade) | ⛔ | |

**2026:** checkout headless con Stripe + un "pricing builder" visual; webhooks a
Supabase para estado de suscripción/entitlements (ya tenemos `entitlements`).

## 2. Experiencia del miembro

| Pieza | PerformLabs | Notas |
| --- | --- | --- |
| Dashboard + welcome messages por plan/journey | 🟡 `/app` | Falta welcome por pricing plan |
| Dashboard variations / bottom nav configurable | 🟡 | Nav DB-driven existe; faltan variaciones |
| Onboarding (signup → datos → generación) | ✅ | Quiz tipo test nuevo, gym/casa, lesiones, enfermedades |
| Recipe Pages (lista + detalle, foto, filtros) | ✅ | `/app/recipes` |
| Food Diary (anillos ingesta, entradas, días) | ✅ v1 | `/app/diary` (sin registro libre todavía) |
| Mostrar/ocultar calorías y macros | 🟡 | Plan ✅ · toggle del miembro y global de marca pendientes |
| My Journey (fotos de progreso) | 🟡 `/app/progress` | Falta photo-journey dedicado |
| Trackers: habit / step / period | ⛔ | Retención alta; habit tracker primero |
| Workout Log (sets/reps/metrics por miembro) | 🟡 | Tabla `workout_performance_logs` existe; falta UI |
| Billing info / account delete (GDPR) | ⛔ | |

**2026:** rings Whoop-style (ya iniciado), readiness/streaks, recap semanal,
habit tracker con Supabase Realtime, step tracker vía Health Connect en build nativo.

## 3. Comunidad y chat

| Pieza | PerformLabs | Notas |
| --- | --- | --- |
| All-member community (feed, posts, likes, moderación, pin, mentions) | ⛔ | `/console/community` interno existe; falta feed del miembro |
| One-to-one chat (miembro ↔ coach, archivos, voz, typing) | ⛔ | `/app/support` es estático |
| Asignar miembros a coach en chat | ⛔ | |

**2026:** **Supabase Realtime** (sin dep nueva) para chat y feed en vivo;
moderación asistida por IA.

## 4. Fitness

| Pieza | PerformLabs | Notas |
| --- | --- | --- |
| Workouts static/variable, programas, días | ✅ | `/coach/programs` con editor + blueprint 12s |
| Exercise library + tipos + prioridades + vídeos | ✅ | `/coach/exercises` (filtros, editar/eliminar, vídeo) |
| Generación por objetivo/nivel/localización/lesiones | ✅ | injury-aware |
| Quitar ejercicio / eliminar día / clonar / publicar | ✅ | |
| Exercise swaps (miembro) | ⛔ | Swap por miembro en la app |
| Workout log + métricas + add set | 🟡 | UI de registro del miembro pendiente |
| Injury notification antes de publicar | 🟡 | Tenemos lesiones en onboarding + blocker |
| Failed-to-generate tab | ⛔ | Cola de fallos para el coach |

**2026:** swaps con sugerencia IA por grupo muscular/equipo; vídeo técnica del coach (ya).

## 5. Nutrición

| Pieza | PerformLabs | Notas |
| --- | --- | --- |
| Categorías, ingredientes, recetas, meals, macro splits | ✅ | `/console/nutrition`, agente IA recetas |
| Meal generator por macros/objetivo/preferencias/alergias | ✅ | |
| Food diary logging básico | ✅ v1 | |
| Smart Add (texto/imagen) | ⛔ | **IA: el mayor leapfrog** |
| Label/barcode scanner | ⛔ | Cámara + OpenFoodFacts (gratis) |
| Dining out | ⛔ | |
| Favorites / reuse previous / treat meals / variety tags | ⛔ | |
| Meal swaps (3 opciones) | ⛔ | |
| Days of meal plan (2–7) / couples | 🟡 | |
| Net carbs, condimentos, refeed/veg days | 🟡 | |
| PDF del plan | ⛔ | |

**2026:** **Smart Add con Claude** (texto/foto → macros), scanner con
OpenFoodFacts en vez de base de pago, swaps con IA.

## 6. Settings · Notifications · Branding

| Pieza | PerformLabs | Notas |
| --- | --- | --- |
| Branding / look & feel | ✅ | `/coach/brand` |
| Notificaciones email + condicionales | 🟡 | `/coach/notifications` |
| Push (broadcast, OneSignal/OneSignal-like) | ⛔ | Web Push (VAPID) o OneSignal |
| Visibilidad calorías/macros (global de marca) | ⛔ | Settings → Visibility |
| Master password / coach roles | 🟡 | Roles existen |
| File manager (PDF) | 🟡 | |
| Account delete (GDPR) | ⛔ | |

## Roadmap priorizado (lo que iremos cerrando)

**P0 — cerrar la nutrición premium (en curso)**
1. Toggle del miembro mostrar/ocultar macros (Perfil → Preferencias). ← siguiente
2. Ajuste global de marca de visibilidad (coach Settings → Visibility).
3. Smart Add con IA (texto → macros) + registro libre (tabla `food_diary_entries`).

**P1 — retención del miembro**
4. Habit tracker (Supabase Realtime).
5. Workout log del miembro (sets/reps/RIR) sobre `workout_performance_logs`.
6. Streaks / readiness / recap semanal.

**P2 — engagement social**
7. Comunidad (feed) + chat 1:1 con Supabase Realtime.
8. Push notifications (Web Push/OneSignal).

**P3 — monetización**
9. Product Plans + Pricing Plans + Stripe checkout + entitlements por webhook.
10. Billing info del miembro + self-service plan change + one-time offers.

**Transversal IA (leapfrog):** copilot del coach, Smart Add, análisis de
check-ins, swaps inteligentes (`@anthropic-ai/sdk`, ver skill `claude-api`).

## Dependencias nuevas previstas

- `stripe` + `@stripe/stripe-js` — pagos (P3).
- `@anthropic-ai/sdk` — IA nativa (transversal). Server env `ANTHROPIC_API_KEY`.
- OpenFoodFacts API (sin dep, REST gratis) — scanner nutricional.
- Supabase Realtime (ya en `@supabase/supabase-js`) — chat/comunidad/trackers.
- Web Push (VAPID, sin dep pesada) u OneSignal SDK — push.

> Guardrails: marketing veraz (sin métricas inventadas), seguridad primero
> (auth del miembro), performance (lazy-load IA/3D), y el listón: *¿se sentiría
> premium para el líder de la categoría?*
