# PerformLabs — Coste de IA y modelo de precio

> Principio: a medida que metemos más IA de Claude, el coste de API es variable y
> escala con el uso. Lo controlamos con **tiering de modelos**, **medición por
> token** y **cuotas mensuales por workspace**, y lo cubrimos con un **precio
> mensual bajo + margen**. Cero pérdidas por el lado de la IA.

## Precios de modelo (USD por 1M tokens, a fecha 2026)

| Modelo | Input | Output | Cache read (~0.1×) | Cache write (~1.25×) |
|---|---|---|---|---|
| Opus 4.8 (`claude-opus-4-8`) | $5 | $25 | $0.5 | $6.25 |
| Sonnet 4.6 (`claude-sonnet-4-6`) | $3 | $15 | $0.3 | $3.75 |
| Haiku 4.5 (`claude-haiku-4-5`) | $1 | $5 | $0.1 | $1.25 |

## Tiering de modelos (la mayor palanca)

| Superficie | Volumen | Modelo | Por qué |
|---|---|---|---|
| **Chat del cliente** (Coach Brain) | Alto (~95% del consumo) | **Sonnet 4.6** | Sigue reglas explícitas del coach; buena fidelidad de voz a ~3× menos coste que Opus. Configurable por env (`COACH_BRAIN_MODEL`) para subir a Opus en tiers premium o bajar a Haiku para minimizar coste. |
| **Generación de planes** | Bajo, gated por el coach | **Opus 4.8** | Calidad importa, volumen pequeño. `PLAN_GENERATOR_MODEL`. |

## Coste por interacción

- **Chat** (~5k input + 0.8k output): Opus ~$0.045 · **Sonnet ~$0.027** · Haiku ~$0.009.
- **Plan** (~2k input + 4k output, Opus): ~$0.11.

A 100 miembros × 30 mensajes/mes = 3.000 mensajes:

| Modelo del chat | Coste chat/mes | + planes (20/mes) | Total IA/mes |
|---|---|---|---|
| Opus | ~$135 | ~$2 | ~$137 |
| **Sonnet (elegido)** | ~$81 | ~$2 | **~$83** |
| Haiku | ~$27 | ~$2 | ~$29 |

> Nota de caching: el mínimo cacheable es 4096 tokens (Opus/Haiku) y 2048 (Sonnet).
> Los `cache_control` están puestos en el system prompt; para "cerebros" grandes
> ahorra input, para pequeños no se activa (sin coste extra). La palanca principal
> de coste es el tiering + las cuotas, no el caching.

## Medición y cuotas

- Cada llamada a Claude se registra en `ai_usage_events` (tokens in/out, cache
  read/write, coste estimado, feature, workspace, miembro).
- **Cuotas mensuales por workspace** (`AI_MONTHLY_LIMITS`, configurables por env):
  - `coach_brain`: 4.000 consultas/mes
  - `plan_gen`: 150 generaciones/mes
  - `photo`: 1.500 análisis/mes
- Al alcanzar el límite: el chat del cliente **no se corta de forma brusca** — su
  mensaje le llega al coach (atención humana garantizada); la generación de planes
  se bloquea con aviso de upgrade. **Hard cap = nunca perdemos dinero.**
- El coach ve su consumo del mes en `/coach/ai` (transparencia + upsell natural).

## Modelo de precio (cubre coste + margen)

Con Sonnet, un coach con 100 miembros activos consume ~$83/mes de IA. Opciones:

1. **Cuota base baja + tier** (recomendado para arrancar): mensualidad baja
   (p.ej. €29-49/mes) que incluye el volumen de `AI_MONTHLY_LIMITS`; cubre al
   coach típico con margen. Coaches con mucho volumen pasan a un tier superior.
2. **Por miembro activo**: p.ej. €0,60-1,00 por miembro activo/mes — escala 1:1
   con el coste (el coste de IA lo genera el número de miembros que chatean).
3. **Híbrido**: base baja + bolsa de IA incluida + por-miembro a partir del umbral.

> El precio mensual se cobra vía Stripe (fase final). Las **cuotas ya están
> activas** y protegen el margen aunque el cobro aún no esté conectado.

## Pendiente (fase Stripe)

- Mapear `AI_MONTHLY_LIMITS` a tiers de plan reales y al `workspace_entitlement`.
- Cobro de la mensualidad + overage / upgrade vía Stripe Connect.
