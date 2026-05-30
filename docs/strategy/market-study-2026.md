# Estudio de mercado 2026 — Fitness + Nutrición + Coaching IA

> Investigación multi-fuente (peer-reviewed + prensa + vendors, mayo 2026) sobre
> qué features/tecnologías diferencian de verdad y dónde está la jugada
> revolucionaria para PerformLabs. Confianza marcada; vendor vs peer-reviewed
> distinguido.

## Veredicto

El chat de IA, los planes adaptativos y la nutrición por foto **ya son
table-stakes en 2026 — no diferencian**. Lo que mueve la aguja y casi nadie
explota bien es el **motor de retención/adherencia humano+IA**: una IA proactiva
que toca al cliente correcto, en el momento correcto, con la voz del coach, y
escala al humano antes del abandono. PerformLabs ya tiene las piezas a medio
construir (Coach Brain + Radar de retención); fusionarlas es la entrada
diferencial.

## Las 4 verdades del mercado (alta confianza)

1. **Lo humano gana, la IA acompaña.** Solo ~10% prefiere IA a un coach humano
   (Global Fitness Report 2026). Humano+IA → **+74% más pérdida de peso** que
   IA sola (HealthifyMe, n≈65.000, U. Michigan/Ross); revisión sistemática
   (Frontiers Digital Health 2025) confirma que lo humano sube adherencia. →
   El modelo white-label coach-in-the-loop es la jugada con mejor evidencia.
2. **IA conversacional + adaptación = línea base**, no diferenciador (Whoop
   Coach, Oura Advisor, Fitbod, Peloton IQ).
3. **La fricción mata, no la precisión.** ~70-80% de abandono en 30 días; ~60%
   deja el tracking por loguear a mano; un hábito tarda ~66 días (ejercicio ~91).
4. **El capital se concentra en wearables/IA e infra B2B**, no en "otra app de
   entreno" (Whoop $10,1B; Strava compra apps de coaching IA; EGYM+Mindbody $7,5B).

## Prioridad

### 🟢 Table-stakes (tenerlo o ir tarde)
Chat IA sobre datos del usuario (PWA OK · ✅ Coach Brain) · programación
adaptativa (PWA OK · ✅ generador) · logging sin fricción foto/voz/texto/barcode
(cámara mejor nativo · 🔜) · streaks + gamificación moderada · push/nudges
contextuales (iOS PWA flojo ~33% vs 95% → email+nativo) · comunidad (✅) · sync
wearable básico (HealthKit = nativo).

### 🔵 Diferenciador — ventana 2026
- **Accountability humano+IA con JITAI** — la mejor evidencia de outcomes y NADIE
  lo automatiza en white-label. PWA OK. → **La jugada de PerformLabs** (Coach
  Brain + Radar de retención).
- **LLM vertical por-creador** (✅ Coach Brain — profundizar).
- **Auto-adaptación por recuperación** (HRV/sueño → entreno de hoy; requiere nativo).
- **Restraint en gamificación** (riqueza media gana: +38% vs baja, +19% vs alta).

### 🟣 Apuesta de futuro (vigilar)
Voz IA en tiempo real en el oído (solo nativo iOS; Web Speech roto en PWA) ·
agentes 100% autónomos (mantener coach-in-the-loop) · **CGM para sanos = hype**
sin evidencia ($1.200-3.600/año) · Apple congeló "Mulberry" feb 2026 → ventana.

## Frontera PWA vs nativo
- **PWA ya sirve:** cerebro IA (chat, planes, nudges, radar, insights), comunidad,
  logging foto/voz/texto, y análisis de técnica por cámara (MediaPipe en navegador).
- **Necesita nativo (Capacitor/RN):** HealthKit/Health Connect, BLE, push fiable
  iOS, audio en background (voz al oído), reconocimiento de voz iOS, store.

## La entrada revolucionaria: "Coach Copilot de retención"
1. El **Radar de retención** detecta quién va a abandonar (✅ construido).
2. El **Coach Brain** redacta el mensaje correcto en la voz del coach para ese
   cliente y ese motivo.
3. **Nudge en el momento de recaída** (JITAI con criterio personalizado).
4. **Escala al humano** cuando el riesgo es alto (+74% outcomes).
Defendible (data-loop por coach), respaldado por evidencia, ~95% viable en PWA.

## Qué NO perseguir
- Carrera de precisión de foto-nutrición (visión es commodity, ~36% error; gana
  la corrección fácil + objetivos adaptativos).
- CGM para sanos (sin evidencia, caro, ansiedad).
- Voz en tiempo real en iOS como feature estrella (bloqueada en PWA → track nativo).

## Fuentes clave
- Humano+IA: U. Michigan/HealthifyMe +74%; Frontiers Digital Health 2025.
- Hábitos/gamificación/JITAI: PMC8767479 (g≈0.42); Frontiers Psychology 2025
  (S-shaped); JMIR Human Factors 2025 (JITAI criterios personalizados).
- Precisión foto: ScienceDirect S2475299125030185 (GPT-4o/Claude ~36% MAPE);
  MyFitnessPal compra Cal AI (TechCrunch 2026-03).
- Wearables: WHOOP Strain Coach; Whoop $10,1B (TechCrunch 2026-03-31).
- PWA: caniuse Web Bluetooth; WebKit bug 198277 (background audio); MediaPipe
  BlazePose en navegador.
- Apple Mulberry congelado: 9to5Mac 2026-02-05.

_Nota: cifras de retención y "accuracy" de vendors son ruidosas; priorizado
peer-reviewed. Hype/inferencia señalado._
