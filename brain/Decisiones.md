---
tags: [decisiones, log]
updated: 2026-05-30
---

# Decisiones (registro)

Las decisiones clave y su _por qué_. La más reciente arriba.

- **2026-05-30 · Auth de miembro en `/app` (cierra P0 de auditoría) + login passwordless** —
  una auditoría (seguridad/arquitectura/UX) destapó que `/app` no tenía identidad
  de miembro: el "miembro actual" era el primer perfil del workspace, `/app`
  estaba fuera del middleware y las actions confiaban en el `workspaceId` del
  cliente → cualquiera leía/escribía datos de cualquier marca. Solución:
  `lib/auth/member-access.ts` (`getMemberContext` resuelve por sesión verificada,
  `member_profiles.user_id`), gate en `proxy.ts` + layout, y los 11 resolvers de
  miembro validan `workspaceId`. Acceso del cliente **passwordless por magic-link**
  (`/acceso` → `signInWithOtp` → el `AuthHashBridge` global activa la sesión),
  reutilizando el callback de invitación existente. Staff sigue en `/login`. El
  modo open/local conserva el demo sin auth. Ver [[Arquitectura]] y [[Features]].

- **2026-05-30 · Imágenes de ejercicio reales vía Cloudinary fetch** — los 873
  ejercicios base (Free Exercise DB) traen `image_urls`, pero la app cliente no los
  mostraba: en `/app/workouts` el thumbnail salía solo de un vídeo subido por la
  marca, así que los ejercicios base aparecían sin foto. Ahora el join trae
  `image_urls` y el thumbnail cae a la foto base cuando no hay vídeo propio. Todas
  las imágenes (ejercicio y, a futuro, receta) se sirven por **Cloudinary fetch**
  (`f_auto,q_auto,dpr_auto`): se optimizan y cachean en CDN **sin subir nada** al
  media library — clave en plan Free con ~1.7k imágenes. Proveedor aislado en
  `lib/cloudinary.ts` (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`). Ver [[Features]] e
  [[Infraestructura]].
- **2026-05-30 · Stripe Connect Standard + 25% application fee** — construido el
  cobro real. Connect **Standard** (no admin del Stripe del coach): los cobros van
  directos a su cuenta y él mantiene el control; el 25% se toma como `application_fee`
  sobre **Direct charges**. Cliente REST propio **sin SDK** (cero dependencias),
  webhooks con firma HMAC e idempotentes, todo **ships dark** sin claves. El coach
  paga su plan de plataforma por Checkout; define los planes que cobra a sus clientes
  como Product+Price en su cuenta conectada. Ver [[Pagos]] y [[Modelo de negocio]].
- **2026-05-30 · Rediseño de consola hacia densidad legible** — pase sistémico
  (fases 1-5) sobre el shell y el sistema de formularios: más información útil por
  pantalla, cards planas, formularios responsive (`auto-fit`), formularios largos
  colapsables (`<details>`), empty states. Se rechazan los patrones glossy
  (gradiente+glow+stripe lateral) y las cards anidadas. Anclado en un `PRODUCT.md`
  raíz (register + principios + objetivo **WCAG AA**). El control de licencia se
  sube al frente en `/console/apps`. Solo presentación: no se tocan server actions
  ni endpoints. Ver [[Sistema de diseño]].
- **2026-05-30 · Imagen en toda receta/comida, key-less con fallback** — cada
  superficie de nutrición muestra foto sin configurar nada: `imageUrl` curada gana;
  si no, foto real sin API key (Loremflickr) por tipo de comida con _lock_ estable
  (djb2) para que no baile entre renders. Fuente **aislada** en un resolver para
  cambiar a Cloudinary tocando un solo punto. Ver [[Features]].
- **2026-05-30 · Service worker solo cachea estáticos (cache v2)** — el SW devolvía
  `undefined` en cache miss (rompía `respondWith`) y cacheaba navegaciones dinámicas,
  rompiendo en silencio el completar de `/app/onboarding`. Ahora intercepta **solo
  assets estáticos** (`/_next/static` + extensiones); navegaciones, RSC, Server
  Actions y `/api` van siempre a red. Cache `v1→v2` para purgar la rota. Ver
  [[Arquitectura]].
- **2026-05-30 · Un solo proyecto Vercel** — un proyecto duplicado doblaba la cuota
  de despliegues del plan Hobby (100/día); se eliminó. Producción única en
  `perform-labs-pcgg` → `www.performlabs.app`. Ver [[Infraestructura]].
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
  de tomar el 25%. _Ahora construido_ → ver [[Pagos]] y la entrada de 2026-05-30.
- **2026-05 · Azul `#078df2` como acento base** (no dorado); cada marca lo
  sobreescribe (white-label).
- **2026-05 · Auto-provisión de cliente solo para admins** del workspace (seguridad:
  el público no puede auto-inscribirse sin pagar).
- **Acordado · Nativo, lo último** (Stripe ya construido). Ver [[Roadmap]].
