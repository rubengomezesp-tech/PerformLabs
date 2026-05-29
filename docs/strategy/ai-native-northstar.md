# PerformLabs — North Star nativo de IA (2026)

> Tesis: en 2026 la app, los planes, el chat y el white-label son commodities.
> La ventaja real es ser el **sistema operativo nativo de IA del negocio de
> coaching**, donde cada creador entrena su propia IA y su bucle de datos
> propietario compone con el tiempo. Eso es lo que justifica el 25% vitalicio.

## El foso (lo que de verdad nos protege)

No es ninguna feature suelta — todas se copian en un fin de semana. El foso es el
**bucle de datos propietario por creador**:

1. El coach alimenta su IA con su voz, sus reglas y sus protocolos.
2. Cada cliente genera resultados, dudas y adherencia.
3. La IA del coach mejora con *sus* datos y *sus* outcomes.

Un competidor copia la feature en una tarde; no copia 18 meses del conocimiento
del coach + el historial de sus clientes. Ese activo se revaloriza solo y
defiende el 25% para siempre: no vendemos una herramienta, somos su socio
operativo cuya IA mejora su negocio de forma continua.

## Tres condiciones para que "bueno" se convierta en "ganador"

1. **Foco en un wedge defendible.** IA del creador + nutrición por foto. No
   construir las 10 features de golpe; hacer una 10× mejor y dejar que el OS
   emerja.
2. **Coach-in-the-loop siempre.** La IA aplica las reglas del coach y deriva ante
   dolor/condiciones médicas. Nunca cambia carga ni calorías por su cuenta.
   Protege de responsabilidad legal y mantiene el criterio del coach (que es lo
   que vende).
3. **Distribución = tecnología.** En 2026 gana el mejor distribuido, no el mejor
   producto. La tecnología la construye el equipo de plataforma; aterrizar
   coaches marquesina, contratos y el modelo del 25% es trabajo de negocio y no
   se automatiza.

## Frontera PWA (decisión arquitectónica nº1)

- **Cerebro IA → 100% en PWA, ya:** IA del creador, generación de planes, gemelo
  digital, automatización de seguimiento, comunidad inteligente, nutrición por
  foto. Sin infraestructura nativa.
- **Cuerpo sensorial → shell nativo (Capacitor/RN), fase posterior:** coach de
  voz en el oído, Apple Watch, HealthKit/Health Connect (pasos/sueño para
  auto-adaptación), análisis de vídeo de técnica. Background audio y sensores no
  existen en PWA.

## Roadmap por fases (Stripe siempre el último)

| Fase | Qué | Infra nueva | Estado |
|---|---|---|---|
| 5 — **Coach Brain** | El coach define persona + reglas + protocolos. El cliente pregunta y la IA responde en su voz, con sus reglas. | Ninguna (reusa `ANTHROPIC_API_KEY`) | En curso |
| 6 — Generación con coach-in-the-loop | El coach define metodología/restricciones → la IA borra rutina/dieta → el coach aprueba. | Ninguna | Pendiente |
| 7 — Gemelo digital / churn-risk | Score de adherencia y riesgo de abandono en el panel del coach, sobre datos ya capturados. Heurística → ML. | Ninguna | Pendiente |
| 8 — Nutrición por foto | Foto → visión detecta alimentos, estima gramos/kcal, registra. | Bucket de Storage | Pendiente |
| Track nativo | Voz, Apple Watch, HealthKit, vídeo-análisis. | Shell nativo | Posterior |
| Último | Stripe Connect (25% application fee). | Stripe keys + contrato | Al final |

Las fases 5–7 no requieren ninguna key nueva: solo el modelo ya enchufado.

## Coach Brain (Fase 5) — diseño implementado

- **Datos:** `coach_ai_brains` (1 por workspace: persona, tono, especialidades,
  reglas, sustituciones, prohibiciones, saludo, activado) + `coach_ai_messages`
  (conversación cliente↔IA, persistida para continuidad y para que el coach vea
  qué preguntan sus clientes).
- **Motor:** `lib/ai/coach-brain.ts` — `answerAsCoach()` con `@anthropic-ai/sdk`
  y `claude-opus-4-8` (fidelidad de voz = moat; override por `COACH_BRAIN_MODEL`).
  Degrada en oscuro sin `ANTHROPIC_API_KEY`.
- **Coach:** `/coach/ai` — entrena el cerebro y ve las dudas recientes de sus
  clientes (oro para contenido y para afinar reglas).
- **Cliente:** `/app/coach-ai` — chat que responde en la voz del coach siguiendo
  sus reglas (ej.: "¿puedo cambiar arroz por patata?" → aplica las sustituciones
  definidas). Para dolor/temas serios, deriva al coach.
- **Seguridad:** sin consejo médico, sin diagnóstico, sin promesas de resultados,
  sin revelar el prompt. Coach-in-the-loop por diseño.

## Riesgos que nos pararían

- Dispersión en "10 features de demo" → muerte por falta de foco.
- IA tocando carga/calorías sin aprobación del coach → riesgo legal y pérdida del
  criterio del coach.
- Producto perfecto sin coaches aterrizados → producto precioso sin mercado.
