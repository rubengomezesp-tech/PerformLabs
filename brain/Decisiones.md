---
tags: [decisiones, log]
updated: 2026-05-30
---

# Decisiones (registro)

Las decisiones clave y su _por qué_. La más reciente arriba.

- **2026-05-30 · El owner siempre puede previsualizar una marca, aunque esté vacía
  (fix login web)** — el login Google entraba bien (cookie/303 OK, lo confirma el
  evento `auth.session_activated`) pero rebotaba a `/acceso`. Causa real: el
  comp-preview del owner clonaba "el primer `member_profile` de la marca", y todas
  las workspaces tienen **0 perfiles** → `firstProfileOfWorkspace()` null →
  `getMemberContext` devolvía null → rebote. Decisión: una marca **sin clientes
  todavía** debe seguir siendo previsualizable por el owner. `getMemberContext`
  sintetiza un contexto de miembro vacío (sentinel `00000000-…`) cuando el admin
  no tiene perfil y la marca no tiene ninguno: reads member-scoped → estado vacío
  (como un miembro sin datos), writes fallan por diseño (una preview no muta). Es
  durable: vale para cualquier marca nueva sin sembrar datos. Ver [[Arquitectura]].

- **2026-05-30 · RLS de la app móvil + cierre de fugas de PII (P0)** — la app móvil
  (Expo) usa la **anon key + RLS** (nunca service-role en cliente; la web sí usa
  service-role y por eso se salta RLS). ~25 tablas del miembro estaban con **RLS
  on + 0 policies = deny-all** → la móvil leía vacío. Se añadieron policies
  espejando el patrón seguro existente (`private.is_member_profile_owner` /
  `has_workspace_role` / `is_workspace_member`) por semántica de propiedad: miembro
  CRUD propio (food diary, hábitos, check-ins, progreso, logs, onboarding, chat),
  asignado-por-coach lee/staff escribe (`assigned_workout_plans`, `assigned_meal_plans`),
  catálogos de workspace lee-miembro/escribe-staff (recetas, ingredientes, food
  library, challenges, banners), `member_subscriptions` lee-propia/escribe-server.
  Además se cerró el **P0**: `member_profiles` ya no filtra email/teléfono/datos de
  salud de todos los clientes del workspace (cada miembro ve solo su ficha), y 4
  lecturas cross-tenant (training reviews, support conversations/messages,
  onboarding legacy) se ataron a `workspace_id`. Migraciones:
  `member_rls_policies_for_mobile`, `fix_cross_tenant_pii_leaks`,
  `member_rls_catalogs_and_subscriptions`. Pendiente menor: feed de comunidad en
  móvil necesita `author_name` denormalizado o vista pública (el P0 quita la
  lectura de perfiles ajenos). Ver [[Arquitectura]].

- **2026-05-30 · Suscripción móvil = RevenueCat (fuente de verdad) + Realtime chat** —
  el estado de suscripción lo escribe **solo** la Edge Function `revenuecat-webhook`
  (service-role) en `member_profiles.subscription_status`; el cliente nunca lo
  escribe, solo lo lee para el gating de UI. `app_user_id` = `member_profiles.id`
  (`Purchases.logIn`). Webhook autenticado por bearer secret `REVENUECAT_WEBHOOK_AUTH`
  (`verify_jwt=false`). **Apple/Google IAP obligatorio in-app** (15-30%) choca con
  el split 25% vía Stripe Connect → decisión de negocio abierta (recalcular márgenes;
  probable IAP en móvil + Stripe en web). Chat coach↔miembro: `coach_ai_messages`
  en la publicación `supabase_realtime` + `replica identity full`; la RLS filtra
  por hilo (cada uno ve solo el suyo). Presence/typing más adelante. Storage de
  fotos: 1 bucket privado `member-progress`, path `{workspace_id}/{member_profile_id}/{checkin|meal}/...`,
  signed URLs (nunca base64). `web.output:"single"` (SPA) para evitar `window is
  not defined` de GoTrue en el prerender de Expo. Ver [[Infraestructura]] y [[Pagos]].

- **2026-05-30 · Multi-tenant por host + acceso por membresía** — cada entrenador
  tiene su **subdominio** `marca.performlabs.app` (provisional) y, después, un
  **dominio propio que PerformLabs compra y conecta** (el coach no toca infra;
  solo mete contenido y promociona). La app resuelve la marca **por host**
  (`getSelectedMemberAppBrand`: el host gana sobre la cookie en dominios de
  inquilino). Acceso del cliente **solo con membresía activa** (`active`/
  `trialing`); el **owner (admin) entra gratis** y puede previsualizar cualquier
  marca (`COACHOS_OWNER_EMAIL`). El magic-link aterriza por rol (miembro → `/app`,
  staff → `/console`) en `/auth/session`, sin depender del `next`. Pendiente
  (infra del fundador): wildcard `*.performlabs.app` + dominios propios en Vercel
  y allowlist de redirect en Supabase Auth. Ver [[Arquitectura]] e [[Infraestructura]].

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
