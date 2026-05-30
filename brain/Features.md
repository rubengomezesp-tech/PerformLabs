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
  foto** (visión). Diario de comida. **Imagen en toda receta/comida** (key-less con
  fallback, ver [[Decisiones]]). Ver [[IA y coste]].
- **Alimentos** — biblioteca propia de la marca + **favoritos**; añadido rápido
  al diario por raciones, sin escribir macros (camino manual, no IA). Trae una
  base de ~36 alimentos comunes que el coach puede cargar y editar.
- **Suplementos** — protocolo pautado por el coach, ordenado por momento del día
  (mañana/pre/post/comida/noche), el cliente lo marca cada día.
- **Progreso** — peso, grasa, tendencia, fotos (fotos necesitan Storage).
- **Hábitos**, **Cardio**, **Recetas**, **Guías**.
- **Comunidad** — feed, posts, likes.
- **Retos** — retos con **leaderboard** calculado de la actividad real
  (entrenos/hábitos/check-ins).
- **Coach IA** — asistente en la voz del coach (herramienta, no titular → [[Posicionamiento]]).
- **Soporte / Mensajes** — conversación 1:1 con el coach.
- **Onboarding** — cuestionario + briefing.
- **Recordatorios push** — opt-in; avisos proactivos aunque la app esté cerrada.

## Entrenador (consola `/coach/*`)

- **Coach IA** (cerebro) + **Generador de planes** (coach-in-the-loop).
- **Radar de retención** + **Coach Copilot** (mensaje de reenganche en su voz).
- **Programas**, **Ejercicios**, **Nutrición**, **Alimentos** (biblioteca),
  **Suplementos**, **Miembros**, **Check-ins** (con medidas: cintura/pecho/cadera),
  **Comunidad**, **Retos**, **Contenido**, **Marca**, **Avisos**, **Analítica**.
- **Facturación** (`/coach/billing`) — conecta su Stripe, gestiona su plan de
  plataforma y define los planes que cobra a sus clientes. Ver [[Pagos]].

## Plataforma (consola `/console/*`)

CRM de leads, marcas, entitlements, seguridad/auditoría, proyectos, plantillas.
Rediseñada hacia **densidad legible** (control de licencia al frente, formularios
colapsables, empty states). Ver [[Sistema de diseño]] y [[Decisiones]].

## Falta (ver [[Mercado y competencia]] y [[Roadmap]])

Fotos de progreso (necesita Storage) · track nativo · checkout del cliente (que
aplica la comisión, ver [[Pagos]]).
