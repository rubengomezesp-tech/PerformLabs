---
tags: [decisiones, log]
updated: 2026-05-30
---

# Decisiones (registro)

Las decisiones clave y su _por qué_. La más reciente arriba.

- **2026-05-30 · i18n propio, sin librería (7 idiomas)** — ES base +
  EN/PT/FR/DE/IT/ZH (chino). Sistema de diccionarios tipados (`lib/i18n/`) en vez
  de next-intl: añadir idioma = 1 diccionario (el tipo obliga a cubrir todas las
  claves). Cero peso extra y
  control total. El idioma se resuelve por cookie (botón visible) → `Accept-Language`
  del navegador ("según zona") → español. Sin rutas `/[locale]` (no reescribimos
  45 rutas). Fase 1 = landing completa + selector; siguientes = login/registro,
  consola y app. Geo-IP descartado (necesita servicio externo que la red bloquea;
  el navegador ya refleja la zona). Ver [[Arquitectura]].

- **2026-05-30 · Librería base de ejercicios como migración (auto-instala)** — 134
  ejercicios profesionales en español (grupo, equipo, ubicación, nivel y cue de
  técnica) como `is_base_library` compartida. Antes vivían en un script SQL manual
  que nadie ejecutaba (prod tenía 4). Ahora es una migración idempotente que se
  aplica sola al desplegar; alimenta la consola del coach y el generador 1-clic.
  Tokens de músculo alineados con el generador (hamstrings = "Femoral"). Ver [[Features]].
- **2026-05-30 · Biblioteca de alimentos propia (no API externa)** — OpenFoodFacts
  está bloqueado por la política de red, así que la base de alimentos es propia
  del workspace + una semilla de ~36 alimentos comunes. El añadido rápido copia
  los macros al diario (sin FK), así favoritos y diario siguen simples. Es el
  camino **manual** de registro (complementa la IA, no la sustituye). Ver [[Features]].
- **2026-05-30 · Cerebro del proyecto en Obsidian** — este vault `brain/` como
  fuente de verdad del _por qué_. Lo mantiene Claude Code.
- **2026-05-30 · Diseño 2026 en toda la plataforma** — Geist + Bricolage + Geist
  Mono, Ethereal Glass, primitivos compartidos. Ver [[Sistema de diseño]].
- **2026-05-30 · La IA NO es el titular** — producto primero (calorías por foto,
  entrenos en vídeo), IA como herramienta de fondo. Mata conversión lo contrario.
  Ver [[Posicionamiento]].
- **2026-05-30 · Wildcard aparcado** — Vercel exige sus nameservers para el cert
  comodín; choca con Cloudflare. Se hará con Cloudflare for SaaS al escalar.
  No bloquea. Ver [[Infraestructura]].
- **2026-05 · Control de coste de IA** — tiering + medición + cuotas con hard cap.
  Ver [[IA y coste]].
- **2026-05 · Stripe Connect (no admin del Stripe del coach)** — la forma correcta
  de tomar el 25%. Ver [[Modelo de negocio]].
- **2026-05 · Azul `#078df2` como acento base** (no dorado); cada marca lo
  sobreescribe (white-label).
- **2026-05 · Auto-provisión de cliente solo para admins** del workspace (seguridad:
  el público no puede auto-inscribirse sin pagar).
- **Acordado · Stripe y nativo, lo último.** Ver [[Roadmap]].
