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
- **Calorías por foto**.
- **Landing v2 producto-primero** + galería deslizable + **[[Sistema de diseño]]
  2026 en toda la plataforma**.

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

## Necesita infra del fundador

- **Fotos de progreso** → bucket de Supabase Storage.
- **Track nativo** (Capacitor) → push fiable iOS + **Apple Watch** + HealthKit. Es
  la conversión de pago. Ver [[Arquitectura]].

## Lo último (acordado)

- **Stripe Connect** → setup + mensualidad + el 25%. Ver [[Modelo de negocio]].
