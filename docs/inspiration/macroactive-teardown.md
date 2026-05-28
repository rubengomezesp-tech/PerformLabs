# Macroactive teardown — reference for PerformLabs

Competitive reference. Macroactive is the closest analogue to PerformLabs:
a white-label platform that lets fitness coaches/creators launch their **own
branded** coaching app (web + iOS + Android). Captured May 2026 from public
pages and listings (their site blocks automated fetch, so this is synthesized
from search-indexed content — verify live before copying anything verbatim).

## What they are / positioning

- Turn fitness pros into "**health creators**" — a turnkey, white-labeled,
  proven business system that automates the manual work of 1:1 coaching.
- Core promise: **"100% your brand: your logo, your colors, your programming,
  your platform."** No "powered by" badge. You own your brand, your advice and
  **all customer data** (they are only a data processor).
- Emotional hook: **"for creators who refuse to build on rented land"** — own
  your platform instead of renting an audience on social.
- Scale message: **"one-to-one feel at a one-to-many scale"** — automate
  personalized meal/workout/mindset so each client feels bespoke.

## Social proof (their heaviest lever)

- **"+$160,000,000 in trainer earnings"** — headline credibility stat.
- **10 years** in market with "an elite crowd of the most influential fitpros."
- Named coaches / testimonials featured prominently ("very easy to set up… staff
  were so helpful", "the team really cares and is invested in my success").

## Product / features

- Branded **web + iOS + Android** apps (mobile as an upsell that "unlocks
  professionalism, visibility, engagement").
- Workout plans: ~150 pre-loaded exercises, **automated programs** from client
  preferences, **substitutions** for injuries/postpartum, custom exercises.
- Nutrition: automated meal plans / macro tracking.
- Client **check-ins**, progress tracking, **in-app messaging**.
- **Live streaming** inside the platform (VIP content + live Q&A).
- Mindset coaching.

## Done-for-you / managed (their moat vs DIY tools)

- Done-for-you **content strategy** + **unlimited video editing**.
- Hands-on **marketing guidance** + done-for-you **advertising**.
- **Managed end-user customer support** team (they support your clients).
- **Launch in ~10 days** (as fast as 48h if exercises are pre-filmed).

## Funnel / go-to-market

- **Sales-led, not self-serve.** Pricing is not public. Multiple conversion
  funnels: `apply.`, `launch.`, `scale.`, `partner.` subdomains, all → "Launch
  Your Own Branded Health & Fitness App" → **Book a demo / Apply**.
- Homepage flow: bold hero → social-proof stat → featured coaches/testimonials →
  feature blocks (app screenshots) → done-for-you services → demo CTA → FAQs.

## What to steal for PerformLabs (truthful adaptations)

PerformLabs sells the same thing, so the structure transfers directly. Adopt the
*shape*, keep claims honest (PerformLabs is newer — do not fake metrics/testimonials):

1. **Ownership-first hero.** Lead with "Tu marca. Tu app. Tu negocio." and the
   real differentiators we can honestly claim: 100% tu marca, **sin "powered
   by"**, **tus datos son tuyos**, app + consola.
2. **A credibility bar** under the hero — use truthful proof (white-label real,
   implantación guiada, **en vivo en ~10 días**) instead of invented numbers.
3. **"Terreno alquilado" angle** — a section on owning your platform vs renting
   an audience.
4. **Feature bento** with our real modules: entrenamiento (vídeo+progreso),
   nutrición (macros+restricciones), check-ins/hábitos, mensajes, guías/soporte,
   progreso. (No live-streaming claim unless we build it.)
5. **Done-for-you framing** — we already say "implantamos"; make it a named
   pillar: implantación guiada + soporte + acompañamiento.
6. **Sales-led CTA** everywhere: "Solicitar propuesta" / "Reservar demo".
7. **Testimonials/featured slot** — leave a structured, clearly-empty section
   ready to fill when we have real coaches (never fabricate).

## Console teardown (from a live customer workspace: `*.macroactive.io`)

Key finding: Rubén Gómez Élite runs the branded member app
(`miembros.rubengomezelite.com`) **on top of Macroactive's console**
(`apexagency-rubengomez.macroactive.io`). They are a *Macroactive customer*.
PerformLabs is the play to replace that console and become the platform.

**Full console nav (what we must match/beat):**
- **Cuentas**: Equipo, Clientes (CRM: filtros nombre/email/género/estado, "More filters", Buscar, **Exportar**, tabla)
- **Ajustes**: General · Finanzas · Analítica · Notificaciones · Ajustes de Subscripción · Fitness · Nutrition (Niveles de Actividad, Metas de Nutrición) · Países
- **Nutrición**: Comidas (**1.221**) → Tipos/Categorías/Cocinas · Recetas (**1.187**, con tiempo/ingredientes/publicado) · Ingredientes → Grupos/Unidades · Tags. Filtros por Publicado y **Source: MacroActive / Custom** (librería base + propia).
- **Fitness** · **Productos** · **Ventas** · **Área de Miembros** · **Herramientas** · **Chat** · **Community** · **Knowledge Base** · **Nutrition Agent (IA)** · **Product Updates**

**Reframe honesto:** Macroactive **no está estancado en features** — es profundo
(CRM, finanzas, analítica, 1.2k comidas / 1.2k recetas con taxonomía completa,
suscripciones, comunidad, y ya un *Nutrition Agent* con IA). Su debilidad real es
la **UI anticuada/densa** (formularios grises, tablas planas) y que es **terreno
alquilado**. Su **foso = la librería de contenido**.

**Dónde está PerformLabs hoy (sorprendentemente competitivo):** ya tenemos consola
con members, nutrition (ingredientes/recetas/categorías/plantillas), training
(ejercicios con vídeo, plantillas, blueprints, módulos trimestrales), billing,
content, community, brand, notifications, analytics, leads, security, projects +
un importador `import-free-exercise-db.mjs`. **El modelo de datos ya da la talla.**

**El wedge para ganar (no clonar):**
1. **Out-design**: consola premium (nuestros `SignalCard`/`Table`/`AttentionQueue`, command palette ⌘K, tablas con densidad pro) vs sus formularios grises.
2. **AI-native**: superar su "Nutrition Agent" con copiloto del coach + generación de programa/dieta desde el briefing + análisis de check-ins.
3. **Cerrar el foso de contenido**: sembrar librería (ejercicios ya; **falta recetas/comidas** — importación o generación con IA).
4. **Ownership**: tu plataforma, no la de Macroactive.

## Detail-screen findings (edit forms + AI agent)

- **Meal = recipe container.** A "Comida" groups a dietary-category multi-select
  (General/Vegano/Pescatariano/Bajo en carbohidratos… many `[Oculto]` combos),
  cuisine, restriction mode (Manual/Automático), image, description, and a **Lista
  de Recetas** (the swap set). This is their substitution engine: a meal resolves
  to a recipe filtered by the member's restrictions. (PerformLabs to build:
  meal-as-container above recipes.)
- **Exercise edit** fields: name, muscle groups, **gender**, location, "used N
  times" usage counter, experience level, **Exercise Types**, **Lesiones
  (contraindications)**, rich-text description. (Add gender + types +
  contraindications to our exercise model.)
- **Nutrition Agent** lives on a separate MVP app (`nutrition-agent.macroactivemvp.com`):
  a basic two-pane AI chat → recipe → "Send to Platform", tabs Create / Review
  Ingredients / Review Recipes, food-DB country selector. It's clearly an add-on
  MVP, not integrated. **We ship a premium, integrated agent instead.**
- **Competitive bug:** their `workout-builder.macroactive.com` throws
  `URIError: Failed to decode param` because it puts the Latin-1-encoded brand
  name ("Rub%E9n G%F3mez") in the URL. Lesson: our builder uses IDs/slugs in
  routes, never raw names — and decodes UTF-8 safely.

## Shipped in PerformLabs so far

- Premium nutrition library (recipes + ingredients, Base/Custom) + base-library seeder.
- Premium training library (workout templates) + exercise library already had base/brand/video.
- **AI nutrition agent** at `/console/nutrition/agent`: prompt → structured macro-costed
  recipe → save to library. Anthropic via fetch, graceful fallback without a key.

## Sources

- https://www.macroactive.com/
- https://www.macroactive.com/product
- https://apply.macroactive.com/ · https://launch.macroactive.com/ · https://scale.macroactive.com/ · https://partner.macroactive.com/
- https://www.macroactive.com/faqs
- https://www.getapp.com/recreation-wellness-software/a/macroactive/
- https://www.saasworthy.com/product/macroactive
