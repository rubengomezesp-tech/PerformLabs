# PerformLabs — modelo de negocio (fuente de verdad)

Cómo gana dinero PerformLabs y qué implica para el producto. Toda decisión de
billing, analítica y propuesta de valor debe alinearse con esto.

## El modelo
- **Revenue-share del 25%**: PerformLabs se lleva el **25% de los beneficios que
  el entrenador genera a través de su app** (suscripciones/ventas de sus clientes).
- **Vitalicio**: el acompañamiento y el share continúan mientras el negocio del
  entrenador funcione — no es un pago único de setup.
- **Acompañamiento real**: no es solo software. El equipo de PerformLabs sigue
  apoyando — **marketing, campañas, impulso del negocio** — para maximizar la app
  y la facturación del entrenador.
- **Incentivos alineados**: PerformLabs solo gana si el entrenador gana → "ganamos
  todos". Es la diferencia frente a un SaaS que cobra fijo facture o no.

## Diferencia con Macroactive
Macroactive = **SaaS**: el creador monta Product/Pricing Plans, **Stripe cobra**,
Macroactive vive de la plataforma + setup. **No reparte beneficios.**
PerformLabs = **socio a éxito** (25% vitalicio + marketing). No vendemos una
herramienta; co-construimos y co-impulsamos el negocio.

## Implicaciones de producto / ingeniería
- **Pagos (cuando montemos Stripe)**: el cliente final paga al **Stripe del
  entrenador** vía **Stripe Connect**; PerformLabs cobra su 25% como
  **application fee** automática por transacción. Lifetime, sin que el entrenador
  tenga que transferir nada a mano.
- **Analítica / Negocio (consola)**: mostrar siempre el desglose —
  **facturación del entrenador**, **share PerformLabs (25%)**, **neto entrenador
  (75%)**. Con datos reales, nunca inventados.
- **Propuesta de valor (landing)**: comunicar el modelo a éxito + acompañamiento
  de marketing como el gran diferenciador ("solo ganamos si tú ganas").
- **Onboarding de marca**: dejar claro en el alta que no hay cuota fija sino 25%
  a éxito + soporte vitalicio.

## Pendiente para implementarlo de verdad
1. **Stripe Connect** con application fee del 25% (necesita claves Stripe).
2. **Vista de Ingresos** en consola con el split 25/75 (cuando haya datos de pago).
3. **Copy del landing** alineado al modelo a éxito.
