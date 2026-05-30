---
tags: [ia, producto, coste]
updated: 2026-05-30
---

# IA y coste

La IA es **herramienta de fondo** (ver [[Posicionamiento]]), siempre
**coach-in-the-loop**. Docs: `docs/strategy/ai-cost-and-pricing.md`.

## Qué hace la IA

- **Coach Brain** — el coach define persona, tono, reglas y sustituciones; el
  cliente pregunta y responde **en su voz** (`lib/ai/coach-brain.ts`).
- **Generador de planes** — brief → la IA redacta el programa en su método → el
  coach aprueba (`lib/ai/plan-generator.ts`).
- **Coach Copilot de retención** — redacta el mensaje de reenganche para el coach.
- **Calorías por foto** — visión estima macros del plato (`lib/ai/vision-nutrition.ts`).
- **Smart Add** — estima macros desde texto (`lib/ai/smart-add.ts`).

Modelo `claude-opus-4-8` / `claude-sonnet-4-6` vía `@anthropic-ai/sdk`. Degrada en
oscuro sin `ANTHROPIC_API_KEY` (ver [[Infraestructura]]).

## Control de coste (proteger margen)

- **Tiering**: chat del cliente → **Sonnet** (más barato, alto volumen);
  generación de planes → **Opus** (calidad, bajo volumen). Configurable por env.
- **Medición**: cada llamada registra tokens + coste en `ai_usage_events`.
- **Cuotas mensuales** por workspace (`AI_MONTHLY_LIMITS`). Al límite, el chat del
  cliente **no se corta** (su mensaje llega al coach); la generación se bloquea con
  aviso. **Hard cap = sin pérdidas.**

Esto sostiene el [[Modelo de negocio]].
