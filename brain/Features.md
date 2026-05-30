---
tags: [producto, features, moc]
updated: 2026-05-30
---

# Features (mapa)

Lo construido, agrupado. Detrás de cada bloque hay tablas Supabase + páginas de
app/consola. Stack en [[Arquitectura]].

## Cliente (app `/app/*`)

- **Entreno** — plan, ejercicios con **vídeo**, series con reps/kg, registro y
  mejores marcas (`workout-performance`).
- **Comida** — plan de comidas, macros, **Smart Add** (texto) y **calorías por
  foto** (visión). Diario de comida. Ver [[IA y coste]].
- **Progreso** — peso, grasa, tendencia, fotos (fotos necesitan Storage).
- **Hábitos**, **Cardio**, **Recetas**, **Guías**.
- **Comunidad** — feed, posts, likes.
- **Coach IA** — asistente en la voz del coach (herramienta, no titular → [[Posicionamiento]]).
- **Soporte / Mensajes** — conversación 1:1 con el coach.
- **Onboarding** — cuestionario + briefing.
- **Recordatorios push** — opt-in; avisos proactivos aunque la app esté cerrada.

## Entrenador (consola `/coach/*`)

- **Coach IA** (cerebro) + **Generador de planes** (coach-in-the-loop).
- **Radar de retención** + **Coach Copilot** (mensaje de reenganche en su voz).
- **Programas**, **Ejercicios**, **Nutrición**, **Miembros**, **Check-ins** (con
  medidas: cintura/pecho/cadera), **Comunidad**, **Contenido**, **Marca**,
  **Avisos**, **Analítica**.

## Plataforma (consola `/console/*`)

CRM de leads, marcas, entitlements, seguridad/auditoría, proyectos, plantillas.

## Falta (ver [[Mercado y competencia]] y [[Roadmap]])

Retos/leaderboard · suplementos · biblioteca de alimentos/favoritos · fotos de
progreso (Storage) · track nativo · Stripe.
