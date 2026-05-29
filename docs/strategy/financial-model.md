# Modelo financiero PerformLabs (resultados)

Generado por `scripts/business-model.mjs` (ejecútalo con `node scripts/business-model.mjs`
para recalcular cambiando supuestos). Moneda en $ para casar con las cifras del
fundador; misma lógica en €.

## Supuestos base
Clientes por entrenador: **15 → 40** en 6 meses · precio medio **$50/mes** ·
vida media del entrenador **3 años** · mantenimiento **$100/año**. (Todo editable.)

## Unit economics por entrenador (lo que gana PerformLabs)
| Escenario | $/mes (régimen) | Año 1 | LTV 3 años | Entrenador se queda |
|---|---|---|---|---|
| **A — 5000 setup + 25%** | $500 | **$10.013** | **$22.213** | **75%** ($1.430/mes) |
| B — 3000 setup + 30% | $600 | $8.995 | $23.595 | 70% ($1.330/mes) |
| C — 0 setup + 35% | $700 | $6.978 | $23.978 | 65% ($1.230/mes) |
| D — 5000 setup + 20% | $400 | $9.030 | $18.830 | 80% ($1.530/mes) |
| E — 4000 setup + 25% | $500 | $9.013 | $21.213 | 75% ($1.430/mes) |

## Sensibilidad (modelo A) — LTV 3 años según tamaño del entrenador
| clientes \ precio | $30 | $50 | $80 |
|---|---|---|---|
| 20 | $10.700 | $14.300 | $19.700 |
| 40 | $16.100 | $23.300 | $34.100 |
| 80 | $26.900 | $41.300 | $62.900 |

El revenue-share **escala con el éxito del entrenador** → incentivos alineados.

## Proyección de plataforma (modelo A, solo el 25%, sin contar setups)
| Entrenadores | MRR PerformLabs | ARR PerformLabs |
|---|---|---|
| 10 | $5.000 | $60.000 |
| 25 | $12.500 | $150.000 |
| 50 | $25.000 | $300.000 |
| 100 | $50.000 | $600.000 |

(Suma aparte los **setups**: 100 entrenadores × $5.000 = **$500.000** de caja inicial.)

## Recomendación del algoritmo → **Escenario A (5.000 setup + 25%)**
Score = LTV ponderado por atractivo para el entrenador (penaliza que se quede <72%)
y por caja inicial (CAC/cashflow):

| Escenario | LTV | Entrenador | Score |
|---|---|---|---|
| **A 5000 + 25%** | $22.213 | 75% | **22.213** ✅ |
| B 3000 + 30% | $23.595 | 70% | 20.305 |
| E 4000 + 25% | $21.213 | 75% | 19.940 |
| D 5000 + 20% | $18.830 | 80% | 18.830 |
| C 0 + 35% | $23.978 | 65% | 15.152 |

### Por qué A
- **C (0 + 35%)** tiene LTV bruto un pelín mayor, pero el entrenador se queda solo
  el 65% (menos atractivo) y **no hay caja inicial** → peor score y peor para vender.
- **A** combina: caja inicial fuerte ($5k cubre construir la app + CAC + cashflow),
  el **25% que compone** con el crecimiento del entrenador, y el entrenador se queda
  **75%** (oferta atractiva). Es el equilibrio ganador.
- El verdadero motor es el **revenue-share**: a 3 años pesa más que el setup, y crece
  si el entrenador crece (por eso el acompañamiento de marketing es rentable para ambos).

## Caveats
- Cifras según supuestos medios; recalcula con tus datos reales (`node scripts/business-model.mjs`).
- El 25% se modela sobre **bruto**. Define en contrato bruto vs neto (tras Stripe/reembolsos).
- Valida fiscal/legal antes de cerrar (ver `monetization-and-contract.md`).
