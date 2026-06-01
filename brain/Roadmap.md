---
tags: [roadmap, plan]
updated: 2026-05-30
---

# Roadmap

## Hecho (en producción)

- Comunidad (cliente + coach) · subdominio provisional (aparcado) · feedback táctil.
- **Coach Brain** · **Generador de planes** (coach-in-the-loop) · **Radar de
  retención** · **Coach Copilot** · **Control de coste de IA** (ver [[IA y coste]]).
- **Push proactivo** (Web Push + cron de inactividad).
- **Calorías por foto** + **imagen en toda receta/comida** (key-less, ver [[Features]]).
- **Landing v2 producto-primero** + galería deslizable + **[[Sistema de diseño]]
  2026 en toda la plataforma**.
- **[[Pagos|Stripe Connect (Standard)]]** — onboarding OAuth del coach, suscripción
  de plataforma, planes del coach (Product+Price en su cuenta) y webhooks firmados.
  Ships dark sin claves.
- **Rediseño de consola** hacia densidad legible (fases 1-5 + control de licencia).

## En curso / siguiente (sin keys, autocontenido)

Base estilo [[Mercado y competencia|MacroActive]] **completada**:
- ✅ **Retos + Leaderboard** (gamificación) — coach crea/cierra, cliente se une y
  ve ranking en vivo. _Pendiente menor: aviso push al ser superado en el ranking._
- ✅ **Suplementos** (plan diario) — protocolo del coach + checklist diario del
  cliente agrupado por momento.
- ✅ **Biblioteca de alimentos propia + favoritos** — sin API externa; favoritos y
  quick-add del cliente.
- ✅ **Medidas corporales** — peso, grasa y cintura con delta vs check-in anterior
  y evolución (sparklines) en la app del cliente; pecho/cadera con surfacing propio.

Siguiente foco sugerido: pulir la gamificación (avisos de ranking) y seguir el
i18n por fases hacia login/registro y consola.

## Auditoría UI/UX 2026-05-31 (ver [[../docs/ux-audit-2026]])

Repaso completo de las 3 superficies + acceso. Fundación sólida; el trabajo restante
es **terminación y consistencia**, no visión.
- ✅ **P0 a11y de fundación** aplicado: `scope="col"` en tablas (primitivo + crudas),
  `role="alert"`/`status` en mensajes de auth, `autoComplete`+tipos en login/registro/
  lead form, labels en `<select>` de tabla, `aria-hidden` en `EmptyState`.
- Pendiente P1 (wow): `loading.tsx`/skeletons en **`/coach` (0 hoy)**, ambiente aurora
  en login/registro, `EmptyState` unificado en la member app.
- Pendiente P2 (deuda): `inputMode` en numéricos, `aria-label` en botones-icono,
  consolidar `globals.css` (13k líneas con capas "(agent)"/"UI UPLIFT").
- Regla del CEO formalizada en **`CLAUDE.md`**: usar siempre tools + MCP disponibles.

## Necesita infra del fundador

- **Fotos de progreso** → bucket de Supabase Storage.
- **Track nativo** (Capacitor) → push fiable iOS + **Apple Watch** + HealthKit. Es
  la conversión de pago. Ver [[Arquitectura]].

## Pagos: lo que queda

El cobro ya está construido ([[Pagos]]). Falta el **checkout del cliente** que aplica
la `application_fee` del 25% sobre los planes del coach, y conectar las claves
Stripe en producción (trabajo del fundador). Ver [[Modelo de negocio]].
