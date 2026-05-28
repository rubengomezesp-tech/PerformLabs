# Auditoria competitiva y arquitectura de producto

Fecha: 2026-05-27

## Objetivo

Construir una plataforma premium para crear, configurar y operar apps de entrenadores con marca propia. La referencia directa es MacroActive, pero el objetivo no es copiar pantallas: es entender su sistema comercial, operativo y emocional para construir una version mas clara, editable y controlable.

## Competidores investigados

- MacroActive: plataforma done-for-you para creadores fitness, marca propia, automatizacion, soporte, onboarding y partnership.
- ABC Trainerize: SaaS self-serve con custom branded apps y add-ons.
- My PT Hub: SaaS todo-en-uno con clientes ilimitados, white-label, pagos, bookings y chat.
- Everfit: coaching app con automatizaciones, onboarding y mensajes programados.
- TrueCoach: app de coaching con program builder, mensajes, video library y progreso.
- PT Distinction: plataforma avanzada para PTs con retos, trials, sistemas, pagos e integraciones.
- Exercise.com: plataforma enterprise para gimnasios y negocios fitness con custom-branded apps.
- FitSW / apps MacroActive Limited: gestion de clientes, workouts, nutricion, pagos, mensajes y progreso.

## Como actua MacroActive

MacroActive vende una transformacion empresarial, no solo una app:

1. Promesa principal: propiedad, marca, clientes, datos y relacion comercial.
2. Angulo emocional: independencia, escala, menos burnout y crecimiento sin construir sobre terreno alquilado.
3. Proceso comercial: llamada o aplicacion, no compra inmediata.
4. Entrega: onboarding specialist, checklist, feedback, tareas y fecha de lanzamiento.
5. App cliente: dashboard, training, meal plans, check-ins, photos, contenido, soporte, live, mindset y upsells.
6. Operacion: soporte al cliente final, contenido, marketing, pagos, datos y mejora continua.
7. Monetizacion: propuesta personalizada/revenue share/partnership, con pricing publico poco visible.

## Lo que hacen bien

- Elevan la percepcion de valor: no compiten por precio.
- Venden control y propiedad de marca.
- Convierten la implementacion en una experiencia guiada.
- Reducen miedo tecnico con especialistas y soporte.
- Usan prueba social, cifras grandes y testimonios.
- Conectan producto con negocio: pagos, cross-sell, soporte y crecimiento.

## Debilidades detectadas

- Pricing opaco: obliga a llamada antes de entender el rango.
- Copy repetitivo y jerarquia visual irregular en algunas paginas.
- Muchas promesas juntas pueden sonar difusas si el cliente no entiende el proceso.
- Apps white-label pueden parecer similares si la personalizacion no es profunda.
- La experiencia de cliente final depende mucho de la calidad del contenido cargado.

## Oportunidad para nuestro producto

Crear una experiencia premium igual de ambiciosa, pero mas clara:

- Proceso visible desde el primer contacto.
- Readiness score por proyecto.
- Checklist accionable para agente y cliente.
- App preview desde la consola.
- CMS editable por marca.
- QA de lanzamiento antes de publicar.
- Copy sin jerga tecnica en landing y app cliente.
- Consola interna con arquitectura real para leads, proyectos, marcas, contenido, fitness, nutricion, pagos, soporte y metricas.

## Arquitectura prioritaria

Base ya creada:

- Landing
- Captura de leads
- CRM
- Proyectos de implantacion
- Briefing
- Plantillas de entrega
- Creacion de workspace/marca
- App cliente con marca seleccionable
- Guias y soporte conectados parcialmente a workspace

Siguiente bloque:

- CMS por marca para editar paginas reales.
- Biblioteca de ejercicios con videos propios por workspace.
- Workout builder conectado a ejercicios.
- Motor nutricional conectado a plantillas, recetas, alergias y categorias.
- QA de lanzamiento: dominio, marca, contenido, pagos, soporte, legal, mobile.
- Filtros/busqueda en CRM, proyectos, contenido y ejercicios.

Posterior:

- Login/roles reales.
- Pagos y checkout.
- Chat/mensajes/notificaciones.
- Comunidad.
- Metricas internas de conversion, activacion, adherencia, churn y soporte.
- App nativa o PWA avanzada con push.

## Decisiones de producto

- Publico: hablar de app propia, agente, marca, URL, contenido, lanzamiento y confianza. No hablar de Supabase, tablas ni arquitectura interna.
- Consola: si puede mostrar estrategia, modulos, readiness, riesgos, acciones y estado real.
- App cliente: cada pantalla debe responder "que hago ahora", no solo enseñar funciones.
- Formularios: menos campos iniciales, mas cualificacion progresiva.
- UI: premium sobria, mobile-first, legible, con botones claros, estados vacios, loading y error.

## Fuentes publicas revisadas

- MacroActive official site: https://www.macroactive.com/
- MacroActive product: https://www.macroactive.com/product
- MacroActive FAQs: https://www.macroactive.com/faqs
- MacroActive onboarding app: https://apps.apple.com/us/app/macroactive-onboarding/id6448698659
- MacroActive trainer guide PDF: https://irp.cdn-website.com/96a0b2f2/files/uploaded/MacroActive%20trainers%20guide.pdf
- ABC Trainerize custom branded app: https://www.trainerize.com/features/custom-branded-fitness-apps/
- ABC Trainerize pricing: https://www.trainerize.com/pricing/
- My PT Hub pricing/features: https://www.mypthub.net/pricing/ and https://www.mypthub.net/features/
- Everfit pricing: https://everfit.io/pricing/
- TrueCoach pricing/app: https://truecoach.co/pricing/ and https://apps.apple.com/us/app/truecoach/id1439127794
- PT Distinction features: https://www.ptdistinction.com/features
- Exercise.com: https://www.exercise.com/
- FitSW App Store: https://apps.apple.com/us/app/fitsw-for-personal-trainers/id1184011053
