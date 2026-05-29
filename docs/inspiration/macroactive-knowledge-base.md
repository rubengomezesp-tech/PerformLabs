# MacroActive Knowledge Base - resumen operativo para Claude

Fecha de extraccion: 2026-05-29T16:30:13.478Z  
Fuente: https://impact.macroactive.com/knowledge  
Cobertura: 241 URLs rastreadas, 0 errores tecnicos, 2 paginas no aprovechables o sin acceso.  
Nota: este archivo es un digest operativo y un mapa completo de articulos/URLs. No contiene copia literal completa de los articulos.

## Prompt sugerido para Claude

Usa este documento como mapa maestro de MacroActive. El objetivo es entender como se gestiona una plataforma MacroActive para un negocio fitness: productos, precios, Stripe, clientes, contenido, comunidad, chat, fitness, nutricion, food diary, check-ins, onboarding y troubleshooting. Cuando respondas, prioriza procedimientos accionables, dependencias entre modulos y riesgos operativos. Si falta un detalle exacto, referencia el articulo/URL indicado en el inventario.

## Resumen ejecutivo

MacroActive se gestiona como una plataforma de membresia fitness con tres capas principales:

1. Oferta comercial: Product Plans definen que recibe el cliente; Pricing Plans definen como se vende y cobra; Stripe ejecuta pagos, cupones, cancelaciones, reintentos, disputas, reportes, checkout y metodos de pago.
2. Experiencia del miembro: dashboard, members area, app pages, bottom navigation, welcome messages, push/email notifications, live streaming, comunidad, chat, video pages, progress updates, My Journey, trackers, food diary y billing info.
3. Entrega del programa: fitness/workouts y nutricion/meal plans se generan desde datos de signup/check-in, objetivos, categorias, preferencias, alergias/dislikes, nivel, localizacion, prioridades y configuracion de macros/calorias.

La ruta operativa habitual es: crear contenido base -> crear Product Plan -> crear Pricing Plan/link -> conectar/sincronizar con Stripe -> cliente compra -> cliente completa formulario de datos -> plataforma genera workout/meal plan -> cliente usa dashboard/app -> check-ins/progress updates renuevan planes -> soporte gestiona cambios, fallos, pausas, cancelaciones y ajustes individuales.

## Mapa de modulos

- Sales > Subscriptions: centro de gestion de clientes, suscripciones, acceso al members area del cliente, reset de password, pausas, progreso, meal/workout plans, generaciones fallidas y enlaces para completar datos incompletos.
- Products > Product Plans: define el contenido vendido: meal plan + workout, meal plan only, workout only, page products, habits u otros componentes.
- Products > Plan Pricing: crea links de precio para productos, recurring/one-off, billing cycle, trials, activation date, coupons, Stripe Checkout y one-time offers.
- Members Area / App Pages: crea paginas internas de app como external URLs, video content, article/blog pages, recipe/video/PDF resources y contenido con acceso segun producto.
- Fitness: gestiona workouts, programas, ejercicios, exercise types, priorities, swaps, videos, logs, objetivos, lesiones y fallos de generacion.
- Nutrition: gestiona categorias, ingredientes, recetas, meals, macro splits, meal generator, food diary, label scanner, dining out, preferences, allergies/dislikes, meal swaps, smart add, check-ins y fallos de generacion.
- Settings / Notifications: controla emails, push notifications, condiciones de notificacion, subscription management, branding/front-end, bottom nav, calorias/macros visibles, master password y otros ajustes.
- Stripe: gestiona cobros reales, refunds, cancellations, coupons, failed payments, disputes, BNPL/Klarna, reports, tax y payment methods.

## Flujos criticos de gestion

### Productos y precios

- Un Product Plan es el producto/contenido vendido. Puede combinar meal plan y workout, o ser solo nutricion, solo entrenamiento o contenido/pagina.
- Un Pricing Plan es el link/componente comercial asociado a un Product Plan. Define nombre visible, tipo de plan, ciclo de facturacion, precio, moneda, activacion, cupones y flujo de checkout.
- Los Pricing Plans pueden ser recurring o one-off. En recurring, el cliente sigue pagando segun ciclo hasta cancelacion; en one-off, paga una vez y el acceso termina segun duracion/configuracion.
- Cuando un pricing link ya fue sincronizado con Stripe, el precio queda bloqueado. Para cambiar precio, clonar el link, cambiar nombre/codigo/precio y sincronizar uno nuevo.
- Trials en recurring existen, pero el articulo indica que se gestionan con Creator Success, no como self-service total.
- Activation Date permite vender antes de que el plan empiece. En recurring, el primer cobro puede ocurrir en compra y el siguiente ciclo se referencia desde la fecha de activacion.
- One-Time Offer permite un upsell post-pago para page products como recipe pages, content/PDF guides, video pages o accordion pages.
- Para cambiar a un cliente de Product Plan, normalmente se cancela la suscripcion actual y se le manda el link del nuevo producto; puede reutilizar el mismo email/password si inicia sesion primero.
- Para cambiar solo de Pricing Plan dentro de Stripe, puede actualizarse la suscripcion en Stripe, pero eso no cambia el Product Plan/entrega de contenido.

### Stripe, pagos y facturacion

- Stripe Checkout se habilita a nivel de Pricing Plan y sirve para reducir friccion con metodos no comunes, autenticacion 3DS y problemas de checkout.
- Cancelaciones/refunds se hacen desde Stripe buscando al cliente por email. Recomendacion operativa: cancelar al final del periodo pagado cuando corresponda, para no cortar acceso antes de tiempo.
- Una suscripcion cancelada en Stripe queda cancelada en la plataforma; no se reactiva como la misma suscripcion. El cliente debe registrarse de nuevo con un link y puede usar la misma cuenta si inicia sesion primero.
- Cupones: aplicar, quitar o actualizar descuentos se hace desde Stripe sobre el customer/subscription. El cupon debe existir primero. El descuento suele impactar la siguiente factura.
- Failed payments: configurar emails preventivos, avisos de tarjeta expirada, Smart Retries o politica custom. El material recomienda evitar multiples cobros acumulados y cancelar/mark uncollectible despues de fallos segun politica.
- Disputas: tratarlas como proceso de evidencia y comunicacion. Tener claro historial de compra, acceso, terminos, uso del producto y soporte dado.
- Stripe Reports y Payments Data se usan para entender ingresos, pagos, refunds, disputas, subscriptions y reporting financiero.
- Stripe Tax permite calcular/cobrar sales tax si se configura correctamente en Stripe y en el flujo de checkout.
- Klarna/Buy Now Pay Later y nuevos payment methods amplian metodos de pago, pero deben validarse en Stripe y en el pricing/checkout.

### Clientes, suscripciones y soporte

- Para ver lo que ve un cliente: entrar a Sales > Subscriptions, buscar por email y usar la gestion/acceso al members area del cliente.
- Reset password: Sales > Subscriptions -> buscar cliente -> Manage -> perfil del cliente -> Account Settings -> introducir nueva password -> Save -> enviar al cliente.
- Master password: permite acceso administrativo segun configuracion, util para soporte y revision.
- Pausas: desde Sales > Subscriptions se puede pausar 1 a 8 semanas. La pausa correcta debe pausar billing y acceso de pago. Tambien puede habilitarse self-pause en Settings > Subscription Settings > Subscription Management.
- No Data/incomplete signup: ocurre cuando el cliente crea cuenta y paga, pero no completa el formulario de datos. Activar email de incomplete subscription y, si hace falta, copiar el link unico desde la suscripcion para que complete datos.
- Duplicados/mismo email: revisar subscriptions/customer data y resolver con cuidado porque dos suscripciones pueden compartir user data.
- Cambios metric/imperial, activity level, nutrition goal, diet preference, meals per day o workout goal se gestionan desde el perfil/suscripcion del cliente y pueden requerir regenerar planes.
- Los clientes pueden cambiar algunos planes por si mismos si se habilita la funcionalidad correspondiente.
- Si un cliente quiere adelantar un update, el articulo indica que no puede forzarse antes de fecha; puede retrasarlo ignorando la notificacion y completandolo mas tarde.

### Plataforma, branding, contenido y notificaciones

- App Pages permite crear paginas externas, video pages y articulos/blogs internos. Casos: Google Drive/PDF resources, web pages, support group, contenido educativo, video libraries y recursos por producto.
- File Manager mejora manejo de PDFs y archivos usados en la plataforma.
- Bottom Navigation Bar y dashboard variations permiten reorganizar la experiencia del miembro.
- Look & Feel/front-end editor gestiona branding visual de la app/members area.
- Calorias y macros pueden mostrarse u ocultarse en miembros segun decision de marca/coaching.
- Welcome messages, push notifications, email notifications y event notification destinations son piezas clave del onboarding y soporte.
- Broadcast push notifications permite enviar mensajes masivos; requiere permisos push y configuracion adecuada.
- Tawk.to puede integrarse como herramienta de soporte/chat externa.
- Live streaming y replay permiten eventos con miembros; las grabaciones pueden reutilizarse si se activa replay.
- Video content puede mostrarse en dashboard slider o liberarse con delayed/dripping sequence relativo al signup.

### Comunidad y chat

- All Member Community incluye automaticamente miembros activos y nuevos suscriptores. Permite feed, posts, comentarios, likes, nicknames, perfiles, reportes y notificaciones.
- Community controls incluyen suspension/moderacion, post moderation, pin posts, video uploads, mentions/tagging y linking con pricing plans.
- La comunidad es un canal de engagement y retencion, no solo soporte. Conviene planear prompts, wins, progreso, retos y contenido recurrente.
- One-to-one chat es responsive y permite mensajes, archivos, imagen/video, voz, typing indicators y notificaciones. Se habilita por pricing plan, por lo que puede venderse como VIP/upsell.
- Chat puede asignar miembros a manager/coach y permite marcar mensajes como unread para seguimiento.

### Fitness y workouts

- Antes de cargar workouts, el material recomienda planificarlos en spreadsheet: muscle group/exercises, sets/reps, duracion, dias por semana, semanas, meses, nivel, localizacion y estructura.
- Workouts pueden ser static o variable. Los static son mas controlados; los variable dependen de tags/criterios para que el generador encuentre ejercicios adecuados.
- Exercises deben tener metadata suficiente: type, muscle group, priority, level, location, video/instructions y otras etiquetas necesarias para generacion.
- P priorities se estan ajustando/phasing out, pero las prioridades siguen apareciendo en logica de generacion y troubleshooting.
- Exercise swaps pueden aplicarse a planes y, segun feature, al plan completo. Hay reglas para habilitar e implementar swaps.
- Filmar workouts y subir exercise videos agrega valor y reduce dudas del cliente. Los videos deben asociarse a ejercicios correctamente.
- Workout Log permite registrar sets/reps/metricas y, en features nuevas, agregar sets adicionales.
- Fallos de generacion suelen venir de falta de ejercicios que coincidan con muscle group + priority + level + location, nivel incorrecto, localizacion equivocada o poca variedad de ejercicios.
- Fix tipico de workout generation fail: leer el error, identificar variable faltante, modificar tags/ejercicio existente, crear ejercicio faltante o editar manualmente el workout del cliente.
- Lesiones o falta de equipo se gestionan cambiando ejercicios, usando swaps, ajustando localizacion o editando el plan individual.

### Nutricion, meal plans y food diary

- Calorias: formula base BMR x Activity Level x Nutrition Goal. BMR usa genero, altura, peso y edad; activity factor da maintenance; goal factor da total calories.
- La plataforma trae base de ingredientes/recetas y genera planes con categorias, preferencias, alergias/dislikes y objetivos.
- Macro splits se controlan por category settings, min/max y distribuciones. Ajustar protein/fat min demasiado alto puede romper generacion.
- Nutrition categories definen opciones de dieta/meal plan. Se puede controlar orden, dias de meal plan, opciones vegetarian/refeed, opciones por goal y visibilidad/publicacion.
- Ingredients, recipes y meals son entidades distintas. Incluso productos preparados como protein bars se agregan como recipe. Meals usan recipes/categorias y deben tener datos nutricionales e imagen/contenido si aplica.
- Meal generator selecciona meals que encajan con calories/macros y restricciones. Poca variedad, demasiados dislikes/allergies o datos incorrectos del cliente provocan fallos.
- Food Diary permite logging; incluye mejoras como macro calculator, label scanner, dining out, acceso a recipe pages, smart add y reutilizacion/favoritos segun features.
- Clientes pueden hacer meal swaps; en casos especificos el coach puede gestionar el plan desde Sales > Subscriptions -> Manage -> Nutrition Plans -> menu de tres puntos -> Manage Plan.
- Para arreglar meal swap generation fail, la guia recomienda seleccionar manualmente una meal alternativa y escalarla a los requisitos del cliente.
- Para nutrition generation fail: revisar dislikes/allergies, bajar min protein/fat si estan demasiado altos, agregar variedad a la categoria, cambiar a categoria general, corregir datos de signup o seleccionar manualmente comidas.
- Smart Check-Ins y progress updates permiten ajustar planes en el tiempo; tambien hay herramientas para enviar meal plan progress updates anytime y reutilizar previous meals.

### Growth y marketing

- El contenido de growth gira alrededor de vender programas fitness online: urgencia, retos pagados, pricing, lead magnets, email funnels, testimonials, Instagram, Reels, Stories, Live, YouTube, content calendars y comunidad.
- Recomendacion general: usar retos/challenges para adquisicion, testimonios/progress pics como social proof, lead magnets para lista de email y contenido recurrente para autoridad.
- La comunidad de miembros debe tener posts de progreso, preguntas, wins, retos, recetas, tips, accountability y contenido que fomente participacion.
- Pricing de programas debe considerar valor percibido, nivel de soporte, frecuencia, bonus, chat/comunidad, y posicionamiento.

## SOPs rapidos

### Crear producto y link de venta

1. Crear o revisar contenido base: workouts, meal categories, recipes/meals, pages, habits o recursos.
2. Ir a Products > Product Plans.
3. Crear Product Plan y elegir tipo: meal + workout, meal only, workout only o contenido/pagina.
4. Configurar nombre, frecuencia de actualizacion y componentes incluidos.
5. Ir a Products > Plan Pricing.
6. Crear Pricing Plan, asociarlo al Product Plan correcto, elegir recurring/one-off, billing cycle, precio, trial/activation/coupon/checkout si aplica.
7. Guardar y sincronizar con Stripe.
8. Probar link de registro/check-out y confirmar que el cliente llega al flujo correcto de datos.

### Gestionar cliente con pago hecho pero datos incompletos

1. Ir a Sales > Subscriptions y buscar por email.
2. Confirmar estado No Data/incomplete signup.
3. Verificar que la notificacion de incomplete subscription este activa.
4. Copiar el link unico de completar datos desde la suscripcion.
5. Enviar al cliente instrucciones para iniciar sesion y completar formulario.
6. Confirmar que la plataforma genera meal/workout plan cuando envie datos.

### Cambiar cliente de producto o precio

1. Si solo cambia precio/billing cycle dentro del mismo producto, actualizar subscription en Stripe al nuevo pricing plan.
2. Si cambia Product Plan/contenido, cancelar la suscripcion actual y enviar link del nuevo producto.
3. Pedir al cliente que inicie sesion con su cuenta antes de comprar de nuevo para mantener email/password.
4. Confirmar acceso y nueva generacion de planes.

### Resolver fallo de meal plan

1. Revisar email/alerta de fallo y abrir cliente en Sales > Subscriptions.
2. Revisar dislikes/allergies excesivos.
3. Revisar category min/max, especialmente protein/fat demasiado altos.
4. Revisar si la categoria tiene pocas meals/variedad.
5. Revisar datos del cliente: altura, peso, goal, activity level, diet preference, meals per day.
6. Ajustar categoria/cliente o seleccionar meal manualmente.
7. Regenerar y confirmar que el plan queda activo.

### Resolver fallo de workout

1. Leer error de generacion para identificar exercise/muscle group/day afectado.
2. Revisar tags requeridos: muscle group, priority, level, location, type.
3. Editar ejercicio existente, crear ejercicio faltante o retaggear ejercicio compatible.
4. Si no hay fix rapido, editar manualmente el workout individual del cliente.
5. Regenerar/guardar y comprobar en members area.

### Cancelar, refund o pausar

1. Para pause: Sales > Subscriptions -> seleccionar customer -> Pause -> elegir 1-8 semanas o resume manual.
2. Para habilitar self-pause: Settings > Subscription Settings > Subscription Management.
3. Para cancel/refund: abrir cliente en Stripe por email.
4. Cancelar al final del periodo pagado salvo que haya razon para cancelar inmediato.
5. Refund desde Payments en Stripe sobre el pago concreto.
6. Confirmar que el acceso/plataforma reflejan el estado correcto.

## Paginas compartidas o de onboarding tecnico

- Creator Success (888 chars)
  - URL: https://impact.macroactive.com/knowledge/creator-success
  - Encabezados: Business Development

- Onboarding (1071 chars)
  - URL: https://impact.macroactive.com/knowledge/onboarding
  - Encabezados: Platform setup | Multimedia Assets | Know your Platform | Business growth tools | Mobile App

- Checkout (977 chars)
  - URL: https://impact.macroactive.com/knowledge/checkout
  - Encabezados: payment_methods

- Client Success Hub (573 chars)
  - URL: https://impact.macroactive.com/knowledge/client-success-hub
  - Encabezados: Business tools | Business Tools

- Technical Setup - Domain and Email (2292 chars)
  - URL: https://impact.macroactive.com/knowledge/domain-and-subdomain
  - Encabezados: Brand Name, Domain, and Support Email | Brand name | Domain | Support email

- Financial Setup - Stripe (877 chars)
  - URL: https://impact.macroactive.com/knowledge/stripe-ob
  - Encabezados: Stripe is the financial platform we use for you to receive payments once your platform is up and running. Your Onboarding Specialist will guide you through the steps of setting up your Stripe account.

- Creative Content (414 chars)
  - URL: https://impact.macroactive.com/knowledge/creative-content
  - Encabezados: Below are guides and requirements for your images and content. | Creative Call

- Customer Journey - Onboarding Sign Up (328 chars)
  - URL: https://impact.macroactive.com/knowledge/customer-journey-onboarding-sign-up
  - Encabezados: The video below shows you the customer onboarding process for your app.

- Klaviyo Setup (2938 chars)
  - URL: https://impact.macroactive.com/knowledge/klaviyo-setup
  - Encabezados: Klaviyo is an e-commerce marketing automation platform, used primarily for email marketing and SMS marketing. We will create a Klaviyo account for you so that you can use this to set up your launch campaign. | 1. Log in to your Klaviyo account | 2. Create Campaign | 3. Edit Campaign | 4. Edit Your Launch Email Template | 5. Preview Launch Email | 6. Schedule and Send Your Launch Email | Upload Email Data

- Developer Accounts (8171 chars)
  - URL: https://impact.macroactive.com/knowledge/developer-accounts
  - Encabezados: This step is for creators who sign up for a Full App product. Please follow our guide for instructions on how to create your developer accounts with Apple and Google. | Apple Developer Account | Step 1: Create an Apple ID | Step 2: Create an Apple Developer Account | Step 3: Enter your personal information | Step 4: Complete Purchase | Step 5: Give MacroActive access to your account | Google Developer Account | ...

- Integration Guide for Redesigned Checkout (3429 chars)
  - URL: https://impact.macroactive.com/knowledge/integration-guide-for-redesigned-checkout
  - Encabezados: Executing Code Based on Different Stages of the Checkout | Impact on Current Thank You Page Code | Special Event for CRM Integrations

- Calculate & Collect Sales Tax with Stripe Tax (5229 chars)
  - URL: https://impact.macroactive.com/knowledge/calculate-collect-sales-tax-with-stripe-tax
  - Encabezados: MacroActive now integrates with Stripe Tax to help you calculate, collect, and report tax on global payments | Tax Included vs Excluded | Benefits and drawbacks of each option | Checkout experience of each option | Revenue impact between tax included and tax excluded | Enabling Stripe Tax | I. Visit the Stripe dashboard and access Tax settings. Click "Continue Tax Setup" to get started. | II. Add a registration | ...

- Manage your payment methods with ease! (1967 chars)
  - URL: https://impact.macroactive.com/knowledge/manage-your-payment-methods-with-ease
  - Encabezados: We’re simplifying how you manage payment methods for your checkout experience.

## Paginas no aprovechables detectadas

- Page not found.
  - URL final: https://impact.macroactive.com/knowledge/how-to-embed-videos-from-vimeo-within-your-platform
  - URL origen: https://impact.macroactive.com/knowledge/how-to-embed-videos-from-vimeo-within-your-platform
- Lo sentimos, no tienes acceso
  - URL final: https://impact.macroactive.com/_hcms/mem/denied
  - URL origen: https://impact.macroactive.com/knowledge/food-diary

## Inventario completo por categoria

### Features

URL categoria: https://impact.macroactive.com/knowledge/features
Articulos detectados: 36

- Evergreen Progress Pics - Turn Progress Photos into Social Proof (2186 chars)
  - URL: https://impact.macroactive.com/knowledge/turn-progress-photos-into-social-proof
  - Encabezados: How it Works | For customers | For Creators

- Show or Hide Calories & Macronutrients Across the Members’ Area (2243 chars)
  - URL: https://impact.macroactive.com/knowledge/show-or-hide-calories-macronutrients-across-the-members-area
  - Encabezados: What is it ? | Why it matters? | How it works? | Configure nutrition visibility in the Toning Environment; | How the Nutrition Information toggle worked before? | Members can configure nutrition visibility in the Member's Area; | Member Experience | The Meal Plan: | ...

- Welcome Messages (3192 chars)
  - URL: https://impact.macroactive.com/knowledge/welcome-messages
  - Encabezados: This new feature allows you to personalize the dashboard experience based on the pricing plan your customers purchased and where they are in their journey with you. | What’s New? | Why Is It Important? | Deliver Better Onboarding | Improve Engagement | Create Premium Experiences | Reduce Confusion | How Does It Work? | ...

- Keep the Device Screen On During Video Playback (Native App Only) (993 chars)
  - URL: https://impact.macroactive.com/knowledge/keep-the-device-screen-on-during-video-playback-native-app-only
  - Encabezados: What it is? | Why it matters? | How it works?

- Accessing the Creator App: A Guide for Creators (1958 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-access-the-creator-app
  - Encabezados: What is it ? | How it works? | Option 1: Using the Member's Mobile App dedicated for Members. | Option 2: Using the Web Application dedicated for Members (Member's Area). | Community | Edit Member's Dashboard | Transformations | Product Updates | ...

- How to Enable Push Notifications for Your App? (1935 chars)
  - URL: https://impact.macroactive.com/knowledge/enabling-push-notifications-for-your-app
  - Encabezados: What is it ? | Why it matters? | How it works? | Configuring OneSignal Account via Creator Console | Features that Support Push Notifications

- All member community (11226 chars)
  - URL: https://impact.macroactive.com/knowledge/global-community
  - Encabezados: How to setup an all member community, what to expect and the community controls | Feature Overview | Creating the All Member Community | Accessing the Community | Accessing community via the Member's Area | Accessing the community via the Creator Console | Community Member count | Setting your community nickname | ...

- Community - Post Moderation Feature (2946 chars)
  - URL: https://impact.macroactive.com/knowledge/community-post-moderation-feature
  - Encabezados: The post moderation feature aims to enhance community management by requiring moderators to approve user-generated content before it is publicly displayed on the feed. | What it is | Why it matters | How it works:

- Mention Members When Creating Posts or Replying to Comments in Community (1222 chars)
  - URL: https://impact.macroactive.com/knowledge/tagging-members-in-the-community
  - Encabezados: How Tagging Works

- Community - Linking with pricing plans (1211 chars)
  - URL: https://impact.macroactive.com/knowledge/community-linking-with-pricing-plans
  - Encabezados: What is it? | Why it matters? | How it works? | Introducing Access Settings | When Community has been set to enabled by a pricing plan | When community access has been set to all active subscribers

- Video Upload in Community for Posts & Comments (4089 chars)
  - URL: https://impact.macroactive.com/knowledge/video-upload-in-community-posts-and-comments
  - Encabezados: What is it ? | Why it matters? | How it works? | Accessing Video Upload in Community Posts & Comments | Enabling the Feature via Toning Environment | FAQ❓

- Pin Posts in Community for Creators (1705 chars)
  - URL: https://impact.macroactive.com/knowledge/pin-posts-in-community-for-creators
  - Encabezados: What is it ? | Why it matters? | How it works? | Accessing "Pin Post" Feature in Community

- Feature One to One Chat (6332 chars)
  - URL: https://impact.macroactive.com/knowledge/feature-one-to-one-chat
  - Encabezados: Feature overview; How to set up chat; Creator Chat view & Member Chat view | 1. Feature overview | 2. How to set up chat | 2.1. Enable chat | 2.2. Chat Email Notifications | 2.3. Chat Push Notifications | 3. Creator Chat view | 4. Member Chat view

- Assigning Members to a Manager/Coach in Chat (2228 chars)
  - URL: https://impact.macroactive.com/knowledge/assigning-members-to-a-manager/coach-in-chat
  - Encabezados: What is it ? | Why it matters? | How it works? | Assigning Members to a Manager/Coach in Chat in the Creator Console; | Push Notifications: | How Would it Change Chat for Members? | FAQs

- Mark Messages as 'Unread' in Chat (2295 chars)
  - URL: https://impact.macroactive.com/knowledge/mark-messages-as-unread-in-chat
  - Encabezados: What is it ? | Why it matters? | How it works? | How creators can mark the messages as unread via the Creator Console: | How creators can mark the messages as unread via the Creator App View: | How members can mark the messages as unread via the Member's Area:

- Enable Video Slider on Dashboard Using Product Specific Video Page Content (2294 chars)
  - URL: https://impact.macroactive.com/knowledge/video-slider-for-dashboard
  - Encabezados: What is it ? | Why it matters? | How it works? | Accessing Video Slider via Member's Area | Enabling the Video Slider in Video Pages via Toning Environment

- Delayed Video Content (dripping sequence) (1343 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-hide-video-items-of-custom-video-pages-relative-to-your-customers-sign-up-date

- My Journey (2402 chars)
  - URL: https://impact.macroactive.com/knowledge/my-journey
  - Encabezados: Customer Progress Management | How it works for the customer: | Photo Journey: | How it works for the Trainer

- Habit Tracker (1581 chars)
  - URL: https://impact.macroactive.com/knowledge/habit-tracker
  - Encabezados: This feature lets your members track progress on specific activities. You can assign habits individually or suggest habits for all members of a product plan. Members can also create and log their own habits. | Functionality | In members area | Managing habits | Habits created by members | Default habits you suggest to your customers | How to enable/disable this feature?

- Period Tracker (2554 chars)
  - URL: https://impact.macroactive.com/knowledge/how-the-period-tracker-looks-and-functions-for-your-customers
  - Encabezados: Features | How Period Tracker looks to your customers | Period Tracker Functionality | Setting up the Tracker | Logging a Period Manually | Editing the Cycle Length and Number of Period Days | How Period Predictions Work

- Using the Step Tracker with Apple Health or Android Health Connect (6946 chars)
  - URL: https://impact.macroactive.com/knowledge/using-the-step-tracker-with-wearables
  - Encabezados: What is it? | Why it matters? | How it works? | Accessing the Step Tracker via Member's Area for the First Time | Accessing the Step Tracker via Member's Area After Connecting with Apple Health or Android Health Connect | Enabling Step Tracker via Creator Console | ℹ️ Update Your Privacy Policy | FAQ:

- Enable/disable Period Tracker via Member's Area (2230 chars)
  - URL: https://impact.macroactive.com/knowledge/enable/disable-period-tracker-via-members-area
  - Encabezados: What is it? | Why it matters? | How it works? | Enabling/disabling Period Tracker via Member's Area | Enabling/disabling Period Tracker via Creator Console for All Female Members

- On demand plan update for Customers (2174 chars)
  - URL: https://impact.macroactive.com/knowledge/on-demand-plan-update-for-customers
  - Encabezados: What’s new? | Why is it important? | How does it work? | Step 1: Enable the feature | Step 2: When does your customer see the option? | Step 3: Customer requests an update

- Rolling out new Dashboard Design (913 chars)
  - URL: https://impact.macroactive.com/knowledge/rolling-out-dashboard-re-org-platform-wide
  - Encabezados: Better placement of plans, and quicker access to features | What is this about? | How does it work? | Considerations | Where do I set my workout plan thumbnail? | How can I get this update?

- Let Your Customers Skip Progress Updates (1844 chars)
  - URL: https://impact.macroactive.com/knowledge/let-your-customers-skip-progress-updates
  - Encabezados: Now they can stick with the program they already know and love. | Why This Matters | How It Works for Your Customers | How to Enable It

- Live Streaming with Your Members (6696 chars)
  - URL: https://impact.macroactive.com/knowledge/live-streaming-with-your-members
  - Encabezados: What is it ? | Why it matters? | How it works? | Configure Live Streaming in the Creator Console; | How Creators Go Live Using the in the NLAF Creator App View? | How Members Can Join the Live Stream Via Member's Area? | 🚫 Limitations of Live Streaming Feature (Phase 1):

- Record & Replay Your Live Streams (2832 chars)
  - URL: https://impact.macroactive.com/knowledge/record-and-replay-your-live-streams
  - Encabezados: What is it? | Why it matters | How it works? | Enable Live Streaming Recording for Creator | Record Live Streams as a Creator | View the Recorded Live Streams as a Member | FAQs

- Workout Notes & Notifications (1654 chars)
  - URL: https://impact.macroactive.com/knowledge/workout-notes-notifications
  - Encabezados: You can now easily track feedback your customers leave during workouts and get notified as soon as they do. | What’s new? | Why is this important? | How does it work?

- Billing Information (2362 chars)
  - URL: https://impact.macroactive.com/knowledge/billing-information-page
  - Encabezados: What is it ? | Why it matters? | How it works? | Accessing "Billing Information" via Member's Area (Web App) | Accessing "Billing Information" via Member's Area (Mobile App)

- Your Brand, Your Layout: Introducing Dashboard Variations (7748 chars)
  - URL: https://impact.macroactive.com/knowledge/dashboard-variations
  - Encabezados: Table of Content | What is it ? | Why it matters? | How it works? | Accessing "Edit Member Dashboard" via the Creator View in Member's Area | Dashboard Header Styles | Uploading the Dashboard Header Logo via Toning Environment | Intro Text Widget Styles | ...

- How to Log Meals Faster by Accessing Recipe Pages from the Food Diary (1746 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-log-meals-faster-by-accessing-recipe-pages-from-the-food-diary
  - Encabezados: What is it ? | Why it matters? | How it works?

- Invite a Friend (4710 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-enable-invite-a-friend-and-how-your-customers-can-invite-others-to-sign-up
  - Encabezados: Features | How to enable "Invite a Friend" on your platform | How trainers can keep track of successful referrals and referees?

- Bottom Navigation Bar (2382 chars)
  - URL: https://impact.macroactive.com/knowledge/bottom-navigation-bar
  - Encabezados: Creators can have a bottom navigation bar for their member's area to provide easier access to core features. | Overview | Bottom navigation bar | All-in-one workout plan page

- How to create a Tawk.to account and attach to your platform (1434 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-tawk.to-account-and-attach-to-your-platform
  - Encabezados: External Features | Adding to your Platform

- Using Recipe Pages (4800 chars)
  - URL: https://impact.macroactive.com/knowledge/using-recipe-pages
  - Encabezados: What is it ? | Why it matters? | How it works? | Accessing Recipe Pages via Member's Area | Configuring Recipe Pages via Creator Console

- Broadcast Your Messages Using Push Notifications (7583 chars)
  - URL: https://impact.macroactive.com/knowledge/broadcast-your-messages-using-push-notifications
  - Encabezados: What is it ? | Why it matters? | How it works? | Configuring Push Notifications via Creator Console | FAQ:

### Business Growth Articles

URL categoria: https://impact.macroactive.com/knowledge/business-growth-articles
Articulos detectados: 26

- How Fitness Creators Use Urgency To Sell More Programs (Fast!) (4069 chars)
  - URL: https://impact.macroactive.com/knowledge/how-fitness-trainers-use-urgency-to-sell-more-programs-fast
  - Encabezados: Creating an urgency campaign can boost your membership numbers—and we’re going to show you exactly how to do that. | How To Create Urgency For Your Fitness Program | Here’s an example of what your promotional calendar can look like:

- How To Launch an Instagram Workout Challenge (9416 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-launch-an-instagram-workout-challenge
  - Encabezados: Launching a challenge without a plan can be daunting, so we’ve put together 8 steps that you can follow to launch your first Instagram workout challenge confidently. | #1: Figure out what your challenge will be | #2: Make sure your social media supports that Challenge through your bio | #3: Create a content schedule to promote the Challenge | Your content schedule will look like this: | #4: Pre-record any content you need to promote the challenge and for the challenge itself | #5: Create all the necessary links and pages to be able to participate in the challenge | #6: Promote the challenge | ...

- How To Be a Leader In The Fitness Space (4035 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-be-a-leader-in-the-fitness-space
  - Encabezados: As a Fitness Creator, you’re more than just a trainer—you’re a huge reason for your client’s success. | What’s Your “Why” as a Fitness Creator? | How To Showcase Your Why in Your Branding

- How To Set-Up Two Factor Authentication (And How It’ll Save You From Getting Hacked) (2389 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-set-up-two-factor-authentication-and-how-itll-save-you-from-getting-hacked
  - Encabezados: Getting your social media profiles hacked as a fitness trainer could mean spending weeks, months, or even years trying to grow back your audience. | Here’s how to set up two-factor authentication on Twitter, Facebook, and Google. | Instagram: | Twitter: | Facebook: | Google:

- How To Set (And Reach) Your Fitness Business Goals (4874 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-set-and-reach-your-fitness-business-2023-goals
  - Encabezados: Like any great goal, you need to have a plan that sets it into motion. As a business owner, you’re going to be dreaming up a lot of goals in the future—and you’ll need to be a master at turning those goals into plans so you can reach them. | How To Set Goals For Your Fitness Business | How To Reach Goals For Your Fitness Business | Ask yourself these questions to reverse engineer every goal you’re trying to reach:

- How To Create a Paid Fitness Challenge for your Online Program (5063 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-paid-fitness-challenge-for-your-online-program
  - Encabezados: Fitness Creators know paid fitness challenges are a great way to grow their online business. Using them can create the ultimate hook that brings new members into their online program—growing their community and revenue. | What is a Paid Fitness Challenge? | How To Advertise a Personalized Paid Fitness Challenge | How To Keep Participants as Program Members

- How To Price Your Online Fitness Program (3618 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-price-your-online-fitness-program
  - Encabezados: In this article, we’re breaking down which trainers should price their programs less than $100pm and which trainers need to be pricing themselves over $100pm. | Low-Ticket Program | High-Ticket Program | It’s Not Actually About The Money

- How To Increase Your Engagement Rate on Instagram (7049 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-increase-your-engagement-rate-on-instagram
  - Encabezados: Here’s how you can increase your engagement rate on Instagram so that you can turn your followers into members of your online program and community. | #1: Social Media is a Two-Way Street | #2: Use Stickers, Polls, Quizzes, and Other Engagement Features | #3: Giveaway Small or Big Prizes | #4: Ask Your Audience To Tag You In Their Stories

- The YouTube Basics: Everything an Online Fitness Creators Needs To Know (6051 chars)
  - URL: https://impact.macroactive.com/knowledge/the-youtube-basics-everything-an-online-fitness-trainer-needs-to-know
  - Encabezados: Fitness creators have already realized how to capitalize on YouTube, and we’ll show you why they’re doing it, how they know what to post, and how they’re turning it into revenue. | Why Fitness Creators Use YouTube To Grow Their Business | What To Post On YouTube as a Fitness Creator | How To Use YouTube To Make Money

- How Fitness Creators Can Use Instagram Live with others (4867 chars)
  - URL: https://impact.macroactive.com/knowledge/how-fitness-creators-can-use-instagram-live-rooms
  - Encabezados: You won’t get left behind on this new feature because we’ve got you covered. Here’s how you can use Instagram Live Rooms as a fitness creator. | 3 Ways To Use Live Rooms (Starting Today!) | Go Live With Your Community | Collaborate With Other Fitness Creators | Kick-Off Program Launches and Events

- How To Use Your Testimonials In Your Marketing Strategy (6029 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-use-your-testimonials-in-your-marketing-strategy
  - Encabezados: Using testimonials on your social feed, in your stories, in your email campaigns and on website landing pages is one of the best ways to turn prospects into program members. | #1: Use Testimonials in Your Feed Posts | #2: Add Testimonials to Your Stories | #3: Place Testimonials Strategically in Your Email Campaigns | #4: Put Testimonials on Your Sales Pages | Sales pages should have two types of testimonials:

- How To Create an Email Funnel for your Fitness Program (9382 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-an-email-funnel-for-your-fitness-program
  - Encabezados: By the end of this guide, you’re going to know how to set up an email funnel and where you can go for more help if you need it. | #1: Choose Your Email Platform | #2: Choose Your Offer | #3: Create a Lead Magnet | #5: Add Scarcity and Urgency to Purchase

- Everything You Need To Know To Market Your Fitness Business (11620 chars)
  - URL: https://impact.macroactive.com/knowledge/everything-you-need-to-know-to-market-your-fitness-business
  - Encabezados: In this guide, we’re going to cover everything you need to know to market your fitness business properly. | How To Brand Yourself as a Fitness Creator | How To Grow Your Audience on Social Media | How To Create Engaging Posts | How To Turn Your Audience Into Paying Clients | How To Create Offers/Discounts For Your Program

- How To Use Fitness Lead Magnets To Get More Email Subscribers (5415 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-use-fitness-lead-magnets-to-get-more-email-subscribers
  - Encabezados: Having Instagram followers is great—but having Instagram followers that are also email subscribers is the best-case scenario. But, how do you get your audience to become email subscribers? By using lead magnets.

- 5 Steps To Grow An Instagram Audience From Scratch (7254 chars)
  - URL: https://impact.macroactive.com/knowledge/5-steps-to-grow-an-instagram-audience-from-scratch
  - Encabezados: Here are the 5 steps to grow an Instagram audience from scratch, so you can turn followers into members of your online fitness program. | Step #1: Get clear on who your ideal client is | Step #2: Create a content schedule | Step #3: Find your ideal clients and start talking to them | Step #4: Find micro-influencers to train and collaborate with | Step #5: Use best practices

- An Introduction to Instagram Reels (5121 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-use-instagram-reels
  - Encabezados: Let’s take a look at the basics around Instagram Reels so you know how to navigate this new feature and can start to brainstorm how you’re going to use it to grow your audience and get more members to your fitness program. | How To Use Instagram Reels

- What to post in your members community group (1948 chars)
  - URL: https://impact.macroactive.com/knowledge/what-to-post-in-your-members-community-group
  - Encabezados: It's vital you post in your members' community group on a regular basis and answer all of the questions they're asking. It lets your members know they're important to you and provides them with plenty of value.

- 25 Content Ideas For Fitness Creators (3678 chars)
  - URL: https://impact.macroactive.com/knowledge/25-content-ideas-for-fitness-trainers
  - Encabezados: That’s why we’re going to give you twenty-five content ideas that you can use in your social media strategy. Ready to get posting? | Here are 25 content ideas for Fitness Creators to use on social media:

- What to include in your daily Instagram Story (3674 chars)
  - URL: https://impact.macroactive.com/knowledge/what-to-include-in-your-daily-instagram-story
  - Encabezados: You should aim to share a variety of story posts every day based on the following topics: | 4+ story posts on exercises | 4+ story posts on food | 2+ story posts about supplements | 3+ daily life story posts | Share tagged stories | Ask me a question | Polls | ...

- The Fitness Influencer’s Ultimate Guide To Creating A Content Calendar (video) (15335 chars)
  - URL: https://impact.macroactive.com/knowledge/the-fitness-influencers-ultimate-guide-to-creating-a-content-calendar-video
  - Encabezados: Every fitness influencer needs a content calendar. And every fitness creator started off thinking they didn’t. | 2. Coming Up With Content Ideas | Looking at other fitness accounts and seeing what their audiences are enjoying | Searching for commonly asked questions within your content and past client experiences | 4. How To Organize Your Content Calendar | 5. How To Automate Your Posting Schedule

- How To Promote An Instagram Live Workout Series (8087 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-promote-an-instagram-live-workout-series
  - Encabezados: Instagram Live workouts are the fitness creators' version of a free sample. We’ll show you how to promote your Instagram Live workout series, in the below steps. | Step #1: Choose Your Date and Time

- How To Create a Virtual Workout (And Promote It) (8046 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-virtual-workout-and-promote-it
  - Encabezados: The fitness world has made an abrupt shift online - Moving your in-person workouts online can be a brand new learning curve of video software platforms, promotions, and marketing. Here are the five steps to creating a virtual workout. | Step #1: Choose Where You’ll Host It

- How to use the Instagram highlights feature as a Fitness Creator (3563 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-use-the-instagram-highlights-feature-as-a-fitness-creator
  - Encabezados: The benefits of using Instagram highlights | How to use Instagram highlights | Step 1: Decide what type of stories you want to highlight | Step 2: Create your highlight covers | Step 3: Post and highlight

- How to build relationships on Instagram (2151 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-build-relationships-on-instagram
  - Encabezados: Getting to know your audience and taking the time to engage with them will provide useful insights that you can use for your future content and marketing ideas. It will also make them more loyal to your brand long-term. Win, win! | How to engage with your Instagram audience

- How To Create a Community Your Members Actually Care About (5814 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-community-your-members-actually-care-about
  - Encabezados: If you want to be one of these trainers, here is what you need to do to grow your community and keep members sticking around... | #1: Choose a platform where members can interact with you and each other | #2: Figure out what type of content you’re going to share | #3: Create a schedule and always be consistent | #4: Call people out and make members feel special | #5: Give them special discounts and prizes

- How to use lead magnets on your Instagram (4416 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-use-lead-magnets-on-your-instagram
  - Encabezados: In this article, you will learn what a lead magnet is and how it can benefit your business when added to social platforms. | A lead magnet could be: | Benefits of a lead magnet | How to use a lead magnet on Instagram | Step 1: Create your lead magnet | Step 2: Share your lead magnet on Instagram

### Navigating Your Platform

URL categoria: https://impact.macroactive.com/knowledge/navigating-your-platform
Articulos detectados: 3

- Customer at NODATA (810 chars)
  - URL: https://impact.macroactive.com/knowledge/trouble-shooting
  - Encabezados: Customer plans showing 'no data' & 'due to expire' what does this mean?

- How to access your customer's members area to see what they are seeing. (787 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-access-your-customers-members-area-to-see-what-they-are-seeing
  - Encabezados: How to sign in as your customer

- How to reset a customers password. (539 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-reset-a-customers-password
  - Encabezados: Reset Customer Password

### Managing Your Platform

URL categoria: https://impact.macroactive.com/knowledge/managing-your-platform
Articulos detectados: 26

- Editing Notifications (1092 chars)
  - URL: https://impact.macroactive.com/knowledge/editing-notifications-1
  - Encabezados: How to edit your notification emails sent to you & your customers.

- Custom email destination for event notifications (644 chars)
  - URL: https://impact.macroactive.com/knowledge/custom-email-destination-for-platform-notifications
  - Encabezados: Creators can assign a custom email address as the destination for event notifications sent to them.

- How to customise notifications based on different conditions. (3203 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-customise-notifications-based-on-different-conditions
  - Encabezados: Conditional Notifications | Setting up a Conditional Notification | Step 1: Create a conditional notification | Step 2: Configuring conditional notification | Placeholders | Default vs. Conditional Notifications Prioritization | Order of Conditional Notifications

- How to Create a Master Password (606 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-master-password
  - Encabezados: Creating a Master Password

- How to create different app pages within the platform. These include external URLs, custom video content, and articles/blogs. (3514 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-different-app-pages-within-the-platform.-these-include-external-urls-custom-video-content-and-articles/blogs
  - Encabezados: Adding Custom App Pages

- Setting activation delay (405 chars)
  - URL: https://impact.macroactive.com/knowledge/setting-a-new-activation-delay
  - Encabezados: Activation Delay

- New File Manager in Console and PDF Handling Improvement (1259 chars)
  - URL: https://impact.macroactive.com/knowledge/new-file-manager-in-console-and-pdf-handling-improvement
  - Encabezados: Manage Your Files Directly Inside Your Creator Console | What’s This About? | Why Is This Important? | How Does It Work? | When Will I Get This?

- Pausing Your Customers’ Subscriptions (2238 chars)
  - URL: https://impact.macroactive.com/knowledge/pause/canceling
  - Encabezados: Give your customers flexibility when life gets in the way. | Why This Matters | How It Works for You | How It Works for Your CustomersCheck this Demo Video | Important Notes

- Bottom Navigation Bar Customization (1564 chars)
  - URL: https://impact.macroactive.com/knowledge/bottom-navigation-bar-customization
  - Encabezados: We’ve introduced new improvements that give you more control over what your customers see in the app’s bottom navigation bar. | What’s new? | Why is this important? | How does it work?

- Push Notifications (953 chars)
  - URL: https://impact.macroactive.com/knowledge/push-notifications
  - Encabezados: Send Push Messages to Customers: | Attaching a Link to a Push Message

- How to edit your front end look & feel (1302 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-edit-your-front-end-look-feel
  - Encabezados: Look and Feel Editor

- Hiding Calories in the Member's Area (583 chars)
  - URL: https://impact.macroactive.com/knowledge/hiding

- Customization for Body Fat % step in Toning (1696 chars)
  - URL: https://impact.macroactive.com/knowledge/customization-for-body-fat-step-in-toning
  - Encabezados: This improvement will make it possible for a Macroactive admin to customize images, ranges, and labels when setting up the body fat %. | What is this about? | Why it matters | How it works?

- Improved Customer Checkins Page (2347 chars)
  - URL: https://impact.macroactive.com/knowledge/improved-customer-checkins-page
  - Encabezados: We’ve improved the Customer Check-ins page to give you a clearer, more actionable view of your customers’ progress, all in one place. These updates are designed to help you quickly understand progress, spot trends, and take action when needed. | What’s new? | Clearer customer viewCheck this Video to see all changes in a nutshell. | Photos at a glance | Key progress metrics upfront | Latest activity | What data is included? | Updated labels | ...

- Coach Role Overhaul (In Plaform) (2362 chars)
  - URL: https://impact.macroactive.com/knowledge/coach-role-overhaul-in-plaform
  - Encabezados: This update expands what the Coach role can do, making it far more useful as you grow and scale your business in 2026 and beyond. You can now involve coaches in more areas of your operation, without giving them access to sensitive financial or platform settings. | What’s this about? | What can your coaches access now? | Main menu access includes: | 🥗 Nutrition | 💪 Fitness | 💼 Sales | 🛠 Tools | ...

- How do I Change a customer from Metric to Imperial? (250 chars)
  - URL: https://impact.macroactive.com/knowledge/how-do-i-change-a-client-from-metric-to-imperial
  - Encabezados: Change measurement system

- How do I switch a customer to another subscription plan? (203 chars)
  - URL: https://impact.macroactive.com/knowledge/how-do-i-switch-a-customer-to-another-subscription-plan
  - Encabezados: Changing subscriptions

- How to change an individual customer's measurement system e.g. Metric -> Imperial. (1013 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-change-an-individual-customers-measurement-system-e.g.-metric-imperial
  - Encabezados: Changing a Customer's Measurement System

- Failed to Generate Plans tabs (550 chars)
  - URL: https://impact.macroactive.com/knowledge/failed-to-generate-plans-tab
  - Encabezados: A quick way to find and manage meal and fitness plans that have failed to generate

- Customer Checkins & Revamped Progress Data (4580 chars)
  - URL: https://impact.macroactive.com/knowledge/customers-progress-page
  - Encabezados: Introducing Customer Checkins and Progress Data page | Customers Checkins | Progress Data page

- Filters for Subscription page (1580 chars)
  - URL: https://impact.macroactive.com/knowledge/filters-for-subscription-page

- Account Delete option for Members (2656 chars)
  - URL: https://impact.macroactive.com/knowledge/account-delete-option-for-members
  - Encabezados: Introducing a GDPR-compliant workflow to manage data deletion requests from members | Overview | How does it work? | How a member can request their data to be deleted | Other ways to access | Fulfilling the request - If support is handled by you

- Creator's Notebook in Member Dossier (1368 chars)
  - URL: https://impact.macroactive.com/knowledge/creators
  - Encabezados: Now You Can Add Notes When Reviewing Your Member's Progress | What’s New? | Why Does This Matter? | How Does It Work? | Key Features:

- You Can Delete Your Customers’ Progress Entries (1404 chars)
  - URL: https://impact.macroactive.com/knowledge/you-can-delete-customers-progress-entries
  - Encabezados: Provide full flexibility for your customers by removing any unwanted progress entries in just a few clicks. | What’s New? | Why It Matters | How It Works | Things to Keep in Mind

- Remind Customers About Upcoming Subscription Renewal Payments (1820 chars)
  - URL: https://impact.macroactive.com/knowledge/new-email-notification-to-remind-your-customers-about-their-subscription-renewals
  - Encabezados: Keep your disputes low by informing your customers of their upcoming subscription renewals. | Quick Walkthrough | Detailed Setup Guide

- Stay Close to Your Customers’ Results with Smart Check-Ins (1414 chars)
  - URL: https://impact.macroactive.com/knowledge/stay-close-to-your-customers-results-with-smart-check-ins
  - Encabezados: When your customers say they're not achieving results — you'll know right away! | Why This Matters | What This Notification Does | How to Enable This Notification | When can I start using this new notification?

### Troubleshooting

URL categoria: https://impact.macroactive.com/knowledge/troubleshooting
Articulos detectados: 5

- Two customers have signed up with the same email. Now I have two seperate subscriptions sharing the same user data. How do I fix this? (530 chars)
  - URL: https://impact.macroactive.com/knowledge/two-customers-have-signed-up-with-the-same-email.-now-i-have-two-seperate-subscriptions-sharing-the-same-user-data.-how-do-i-fix-this
  - Encabezados: 2 customers on the same data

- I’ve had 2 people go to sign up, paid, but not complete the needed info, activity level, fitness goal etc. Am I able to enter this for them? (650 chars)
  - URL: https://impact.macroactive.com/knowledge/ive-had-2-people-go-to-sign-up-paid-but-not-complete-the-needed-info-activity-level-fitness-goal-etc.-am-i-able-to-enter-this-for-them
  - Encabezados: Subscription Details

- Customer would like to bring their update forward 2 days/extend 2 days. Is this possible and how? (435 chars)
  - URL: https://impact.macroactive.com/knowledge/customer-updates-customer-would-like-to-bring-their-update-forward-2-days/extend-2-days.-is-this-possible-and-how
  - Encabezados: Customer Management

- Generation failures (242 chars)
  - URL: https://impact.macroactive.com/knowledge/trouble-shooting-1
  - Encabezados: Can't generate plan for customer

- How to fix customer No Data issue (1429 chars)
  - URL: https://impact.macroactive.com/knowledge/incomplete-sign-up-no-data
  - Encabezados: Incomplete Sign Up - No Data

### Products and Pricing

URL categoria: https://impact.macroactive.com/knowledge/products-and-pricing
Articulos detectados: 12

- Let Your Customers Change Their Plans on Their Own (5336 chars)
  - URL: https://impact.macroactive.com/knowledge/let-your-customers-change-their-plans-on-their-own
  - Encabezados: We’ve introduced a self-service plan change feature that allows your customers to move between pricing plans on their own, without needing your help or support intervention. This gives your business more flexibility, helps your customers stay longer, and removes friction when they want to switch plans or billing cycles. | Why this matters for your business | What your customers can do | How to enable plan self-management | 1. Request this feature to us | 2. Set upgrade and downgrade options for your pricing plans | 3. What your customers see in their app | 3.1. Main menu | ...

- How to create a Product Plan. (3182 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-product-plan
  - Encabezados: Creating a Product Plan (a product to sell) | Creating a Meal Plan only product | Creating a Workout only product

- Can't Clone Pricing Plan (249 chars)
  - URL: https://impact.macroactive.com/knowledge/cant-clone-pricing-plan
  - Encabezados: Pricing and Stripe

- How to create a recurring pricing link with a trial period (968 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-recurring-pricing-link-with-a-trial-period
  - Encabezados: Creating a Trial Product

- Can I change the price of an existing pricing link? Or do I need to create a new one? (385 chars)
  - URL: https://impact.macroactive.com/knowledge/can-i-change-the-price-of-an-existing-pricing-link-or-do-i-need-to-create-a-new-one
  - Encabezados: Pricing and Stripe

- Minimum dollar value for pricing plans (1142 chars)
  - URL: https://impact.macroactive.com/knowledge/minimum-dollar-value-for-pricing-plans
  - Encabezados: Creators will be able to create pricing plans and coupon codes freely, however, an internal mechanism will make sure that no payment goes below the amounts stipulated in our T&Cs | Pricing Plan Creation | New info field

- Defining "Activation Date" for pricing plans (4814 chars)
  - URL: https://impact.macroactive.com/knowledge/defining-activation-date-for-pricing-plans
  - Encabezados: Creators can select a custom date on a specific pricing plan. All members purchasing this pricing plan will receive their plan(s) on the same date.

- One Time Offer at checkout (2507 chars)
  - URL: https://impact.macroactive.com/knowledge/one-t
  - Encabezados: This mechanism allows members to purchase an extra product without entering their card details again | What is it? | Why Does It Matter? | What can be sold as an upsell? | One-Click Upsell Flow Overview: | How to set up an upsell product? | Video Demo | Exclusions:

- How to create a pricing plan (2469 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-a-pricing-plan-url-link
  - Encabezados: Creating a new pricing plan URL | It is not possible to create plans below the "Minimum Dollar Value" as long as the pricing is at least $3 USD (three American dollars) per week, or $0.4285 USD per day.

- I am running a sale and want to setup a weekly price for the first two weeks only, then go back to full price after 2 weeks. Is this possible? (1295 chars)
  - URL: https://impact.macroactive.com/knowledge/i-am-running-a-sale-and-want-to-setup-a-weekly-price-for-the-first-two-weeks-only-then-go-back-to-full-price-after-2-weeks.-is-this-possible
  - Encabezados: Pricing and Stripe

- How members area access works for end customers with expired/cancelled plans (1605 chars)
  - URL: https://impact.macroactive.com/knowledge/members-area-access-rules-for-end-customers-with-expired/cancelled-plans
  - Encabezados: All end customers will be able to login to their members area even when their plans are expired or cancelled. Therefore, they will have the ability to access 'My Journey' even after plan expiration or cancellation. | One off/challenge plans being cancelled/expired | Recurring plans being cancelled

- How do I manage customers asking if they can sign up now but start their plan later on? (136 chars)
  - URL: https://impact.macroactive.com/knowledge/how-do-i-manage-customers-asking-if-they-can-sign-up-now-but-start-their-plan-later-on
  - Encabezados: Custom Activation date

### Stripe

URL categoria: https://impact.macroactive.com/knowledge/stripe
Articulos detectados: 13

- How to process a cancellation and/or refund in Stripe (1971 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-process-a-refund-in-stripe
  - Encabezados: This guide will show you how to perform customer cancellations and refunds within Stripe

- How do I remove a coupon? (572 chars)
  - URL: https://impact.macroactive.com/knowledge/how-do-i-remove-a-coupon
  - Encabezados: Pricing and Stripe

- How to Apply a Coupon to an existing customers account within Stripe (969 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-apply-a-coupon
  - Encabezados: How to Apply a Coupon

- Removing a coupon from a specific subscription (548 chars)
  - URL: https://impact.macroactive.com/knowledge/removing-a-coupon-from-a-specific-subscription

- Cover customer disputes, and how to approach each. (7080 chars)
  - URL: https://impact.macroactive.com/knowledge/cover-customer-disputes-and-how-to-approach-each
  - Encabezados: Customer Disputes

- How to use and enable Stripe Checkout (1369 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-use-and-enable-stripe-checkout
  - Encabezados: Stripe Checkout

- My customer's payment is declining when trying to purchase my program. (808 chars)
  - URL: https://impact.macroactive.com/knowledge/my-customers-payment-is-declining-when-trying-to-purchase-my-program
  - Encabezados: Payment Declined

- Failed Payments (1582 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-edit-a-retry-schedule-and-activating-email-notification
  - Encabezados: Dealing with Failed Payments and how to edit a retry schedule and activating email notification.

- How to pause customer subscription payments within Stripe (1448 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-pause-customer-subscription-payments-within-stripe
  - Encabezados: Pausing Subscription Payments

- Stripe supports Buy Now, Pay Later Payments with Klarna! (1602 chars)
  - URL: https://impact.macroactive.com/knowledge/accept-buy-now-pay-later-payments-with-klarna
  - Encabezados: Klarna is a popular Buy Now, Pay Later option available in Europe, Canada, Australia, New Zealand, the UK, and the US, Klarna lets customers choose to pay now, later, or in installments, depending on their location

- How to change a customer to a different product or pricing plan (2042 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-change-a-customer-to-a-different-product-or-pricing-plan
  - Encabezados: Changing To A Different Product/Pricing Plan | Changing Customer To A Different Pricing Plan

- How to generate financial reports in Stripe (1758 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-generate-stripe-reports
  - Encabezados: This guide will explain how you can generate necessary reports in Stripe (e.g. for financial and accounting purposes)

- How to report on (and understand) Stripe Payments (2225 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-interpret-your-stripe-payments-data
  - Encabezados: Viewing and understanding your Stripe payments, along with all associated fees.

### Fitness

URL categoria: https://impact.macroactive.com/knowledge/fitness
Articulos detectados: 30

- Publish/Unpublish workouts (997 chars)
  - URL: https://impact.macroactive.com/knowledge/publish/unpublish
  - Encabezados: Bulk publish/unpublish, View published/unpublished only, Find where are workouts being used.

- How to clone a workout (741 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-clone-a-workout
  - Encabezados: Clone an Existing Workout

- How to structure and input exercises & custom workouts into your platform. (4864 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-structure-and-input-exercises-custom-workouts-into-your-platform
  - Encabezados: In this guide we will cover how to structure and input custom workouts into your platform. | How To Create Workouts

- How to create a fitness program (3412 chars)
  - URL: https://impact.macroactive.com/knowledge/fitness-building-programs-products-1
  - Encabezados: Fitness (Building Programs & Products) | How To Create a Fitness Product

- How to edit a workout (600 chars)
  - URL: https://impact.macroactive.com/knowledge/fitness-building-programs-products
  - Encabezados: Edit an Existing Workout

- How To Create Workouts (4674 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-create-workouts
  - Encabezados: To create a new workout on the system, follow these steps; | Entering the exercises into Workouts; | Static Example | Variable Example

- Exercise Library: Add value to your fitness product! (3610 chars)
  - URL: https://impact.macroactive.com/knowledge/exercise-library-add-value-to-your-fitness-product
  - Encabezados: This is a new app page that you can monetize or add to your current plans. | What’s new? | Why is this important for you? | Increase perceived value of your programs | Empower your customers | Reuse your existing content | Control access by plan | How does it work? | ...

- Adding Exercises (1207 chars)
  - URL: https://impact.macroactive.com/knowledge/adding-exercises
  - Encabezados: In this guide we will cover how to input exercises into your platform.

- Adding Exercise Types (1464 chars)
  - URL: https://impact.macroactive.com/knowledge/adding-exercise-types
  - Encabezados: In this guide we will cover how to input exercise types into your platform and their functionality. | Functionality of a Super Set & Giant Set vs. Normal Set

- Phasing out P priorities (3596 chars)
  - URL: https://impact.macroactive.com/knowledge/phasing-out-p-priorities
  - Encabezados: We're excited to introduce the ability to create your own "exercise types" for organizing your exercises. You can now create custom tags, such as compound, isolated, or bodyweight, instead of relying on the previously fixed P1-P10 labels. | Why it matters: | How it works? | Introducing exercise types section | Exercise Types when creating/editing an exercise | Priorities when creating/editing a workout | What Happens to My Existing Workouts with P1-P10 Priorities? | How can I enable this feature?

- Swap Exercises in Static Workouts (2029 chars)
  - URL: https://impact.macroactive.com/knowledge/swap-exercises-in-static-workouts
  - Encabezados: Give your members the flexibility they’ve been asking for—now in all workout types. | 💡 What’s new? | 🤔 Why this matters to you | 🔄 How swaps work in static workouts | 🏠 Location flexibility built-in | 🔧 Control this feature from your settings

- Exercise Swaps Now Apply to the Entire Plan (1486 chars)
  - URL: https://impact.macroactive.com/knowledge/exercise-swaps-now-apply-to-the-entire-plan
  - Encabezados: Save time and give your clients a more personalized experience | What’s new? | Why this matters to you | How it works | When can you start using this?

- How exercise swap is enabled and how it is implemented within your platform (520 chars)
  - URL: https://impact.macroactive.com/knowledge/how-exercise-swap-is-enabled-and-how-it-is-implemented-within-your-platform
  - Encabezados: Exercise Swap

- Filming Your Workouts (2814 chars)
  - URL: https://impact.macroactive.com/knowledge/filming-your-workouts

- How to Input Exercise Videos into your Platform. (2083 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-input-exercise-videos-into-your-platform
  - Encabezados: Uploading Videos to New or Existing Exercises | Uploading/Replacing new videos for existing exercises

- Flexible workout log - ability to add additional sets (1213 chars)
  - URL: https://impact.macroactive.com/knowledge/flexible-workout-log-ability-to-add-additional-sets
  - Encabezados: What it is? | Why it matters? | How it works? | How can I receive this feature?

- Workout Log (1692 chars)
  - URL: https://impact.macroactive.com/knowledge/workout-log-feature
  - Encabezados: Features

- What are Metrics? (1205 chars)
  - URL: https://impact.macroactive.com/knowledge/what-are-metrics
  - Encabezados: Workout Log Metrics

- How to change a customer workout location (78 chars)
  - URL: https://impact.macroactive.com/knowledge/changing-a-customer-workout-location
  - Encabezados: Changing a customer workout location

- Injury Notification: Stay Ahead & Keep Your Customers Safe (2082 chars)
  - URL: https://impact.macroactive.com/knowledge/injury-alerts-stay-ahead-keep-your-customers-safe
  - Encabezados: A smarter way to respond to customer injuries before a plan goes live. | What’s New? | With this update: | How It Works | Considerations | When Can You Start Using This?

- How to edit an existing workout in your platform (1921 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-edit-an-existing-workout-in-your-platform
  - Encabezados: Edit an Existing Workout | Edit an Exercise and apply this change to all weeks of the period.

- Generating a new workout program (1365 chars)
  - URL: https://impact.macroactive.com/knowledge/generating-a-new-workout-program
  - Encabezados: How to generate a new workout program for a customer

- Can't generate a workout program (106 chars)
  - URL: https://impact.macroactive.com/knowledge/cant-generate-workout-program
  - Encabezados: Trouble Shooting - workout generation fail

- Customer has hand injury and can't perform weighted exercise (Incomplete) (407 chars)
  - URL: https://impact.macroactive.com/knowledge/customer-has-hand-injury-and-cant-perform-weighted-exercise
  - Encabezados: Workout Programs

- I have removed an exercise from a clients plan due to injury. How can I stop this exercise being pulled though on their next workout plan? (849 chars)
  - URL: https://impact.macroactive.com/knowledge/i-have-removed-an-exercise-from-a-clients-plan-due-to-injury.-how-can-i-stop-this-exercise-being-pulled-though-on-their-next-workout-plan
  - Encabezados: Injuries

- If a client who already has their training programs wants a day added (from 4 to 5 days) do I have to regenerate a whole new program? Or can I just add a day? (264 chars)
  - URL: https://impact.macroactive.com/knowledge/if-a-client-who-already-has-their-training-programs-wants-a-day-added-from-4-to-5-days-do-i-have-to-regenerate-a-whole-new-program-or-can-i-just-add-a-day
  - Encabezados: Customer Management

- Customer gym doesn't have machine to perform exercise (422 chars)
  - URL: https://impact.macroactive.com/knowledge/customer-gym-doesnt-have-machine-to-perform-exercise
  - Encabezados: Workout Program changes

- How you can fix workout plan generation failures & what they mean. (3109 chars)
  - URL: https://impact.macroactive.com/knowledge/workout-plan-generation-failures-what-they-mean-and-how-you-can-fix
  - Encabezados: Workout Program Generation Fail | 1. Platform can't find an appropriate exercise for the workout | 2. Customer has selected 'beginner'. Static workout contains 'intermediate' exercises | 3. Customer has selected wrong workout location

- How to edit an existing workout program for a customer (629 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-edit-an-existing-workout-program-for-a-customer
  - Encabezados: Editing an existing workout program

- How to change a customers workout goal (1277 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-change-a-customers-workout-goal
  - Encabezados: Changing Customer Goal

### Nutrition

URL categoria: https://impact.macroactive.com/knowledge/nutrition
Articulos detectados: 65

- 🥗 Say Goodbye to Repetitive Meals: Introducing Variety Tags in Meal Generator (2506 chars)
  - URL: https://impact.macroactive.com/knowledge/say-goodbye-to-repetitive-meals-introducing-variety-tags-in-meal-generator
  - Encabezados: What’s This About? | Why It Matters | What’s New? | ✅ Here’s the best part: | How to Use or Edit Variety Tags | Important to Know | How to Activate Variety Tags in the Meal Generator

- Overview of the Nutrition Aspect of Your Platform and How to Customise It (7696 chars)
  - URL: https://impact.macroactive.com/knowledge/nutrition-overview
  - Encabezados: Nutrition Overview | How the Platform Determines a Customer's Calorie Requirements | How the Nutrition Platform works | Navigating the Nutrition on your Platform | Removing Nutrition from the Platform | Nutrition Category Settings | Changing Macronutrient Splits | Refeed Day & Vegetarian Day Options | ...

- Changing Macronutrient Distributions: (3993 chars)
  - URL: https://impact.macroactive.com/knowledge/changing-macronutrient-distributions

- One client asked if there was a record of his prior nutritional plan as he had purchased food for it prior to it refreshing. Is there? And can it be exported? (426 chars)
  - URL: https://impact.macroactive.com/knowledge/one-client-asked-if-there-was-a-record-of-his-prior-nutritional-plan-as-he-had-purchased-food-for-it-prior-to-it-refreshing.-is-there-and-can-it-be-exported
  - Encabezados: Meal Plan

- Customer dislikes appearing in meal plan (361 chars)
  - URL: https://impact.macroactive.com/knowledge/customer-dislikes-appearing-in-meal-plan
  - Encabezados: Trouble Shooting

- The caloric requirements for one of my customers is too low or too high, how do I change this? Why did this occur? (878 chars)
  - URL: https://impact.macroactive.com/knowledge/the-caloric-requirements-for-one-of-my-customers-is-too-low-or-too-high-how-do-i-change-this-why-did-this-occur
  - Encabezados: Nutrition

- Show Nutrition FAQ section (648 chars)
  - URL: https://impact.macroactive.com/knowledge/faq-section
  - Encabezados: Answers to guide your customers:

- What is a Keto diet? And what are the pros & cons of a Keto diet? (2960 chars)
  - URL: https://impact.macroactive.com/knowledge/what-is-a-keto-diet-and-what-are-the-pros-cons-of-a-keto-diet

- Net Carbohydrate Function (& why nutritional information does not equal manual calculations c*4, p*4 + f*9). (1547 chars)
  - URL: https://impact.macroactive.com/knowledge/net-carbohydrate-function
  - Encabezados: Net Carbohydrate Function

- Why do my calories/macros vary between options (days)? (2789 chars)
  - URL: https://impact.macroactive.com/knowledge/why-do-my-calories/macros-vary-between-options-days

- How we determine calories (3216 chars)
  - URL: https://impact.macroactive.com/knowledge/how-we-determine-calories
  - Encabezados: Maintenance Calories x Nutrition Goal = the total calories that the meal plan is generated from.

- Why are my calories too low/too high? (1902 chars)
  - URL: https://impact.macroactive.com/knowledge/why-are-my-calories-too-low/too-high

- What goal to select (cutting or bulking)? (2658 chars)
  - URL: https://impact.macroactive.com/knowledge/what-goal-to-select-cutting-or-bulking

- Keto FAQ (7962 chars)
  - URL: https://impact.macroactive.com/knowledge/keto-faq

- Using Condiments in Conjunction with your Meal Plan (586 chars)
  - URL: https://impact.macroactive.com/knowledge/using-condiments-in-conjunction-with-your-meal-plan

- Why are the calories on my plan not adding up correctly to “MyFitnessPal”? (5166 chars)
  - URL: https://impact.macroactive.com/knowledge/why-are-the-calories-on-my-plan-not-adding-up-correctly-to-myfitnesspal

- Additional Protein Shakes Explained (1638 chars)
  - URL: https://impact.macroactive.com/knowledge/additional-protein-shakes-explained

- What is the best diet for me? (2850 chars)
  - URL: https://impact.macroactive.com/knowledge/what-is-the-best-diet-for-me

- Macronutrients Explained (5013 chars)
  - URL: https://impact.macroactive.com/knowledge/macronutrients-explained

- A Complete Guide on Substituting Meals/Food Items (8535 chars)
  - URL: https://impact.macroactive.com/knowledge/a-complete-guide-on-substituting-meals/food-items
  - Encabezados: Substituting Meals/Food Items

- How to adjust a customers daily calories, and the reasons why they might be too high/low (1547 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-adjust-a-customers-daily-calories-and-the-reasons-why-they-might-be-too-high/low
  - Encabezados: Changing Customer Calories

- How to enable Vegetarian and Refeed Days for your nutrition categories. (1466 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-enable-vegetarian-and-refeed-days-for-your-nutrition-categories
  - Encabezados: Vegetarian & Refeed Days

- How you can adjust category Min/Max settings to achieve your desired macro split (2373 chars)
  - URL: https://impact.macroactive.com/knowledge/how-you-can-adjust-category-min/max-settings-to-achieve-your-desired-macro-split
  - Encabezados: How to Reduce Macronutrient Variation

- Nutrition Label Scanner for Food Logging (2255 chars)
  - URL: https://impact.macroactive.com/knowledge/nutrition-label-scanner-for-food-logging
  - Encabezados: 1) What’s new? | 2) Why is it important? | 3) How does it work? | 📍 Scenario 1: Barcode scan fails ( for supported countries) | 🌍 Scenario 2: No barcode scanner available (Other countries) | How can I get this feature? | ✅ What your customers can expect

- Food Diary improvements (oct-nov, 2023) (2894 chars)
  - URL: https://impact.macroactive.com/knowledge/food-diary-improvements-oct2023
  - Encabezados: Simplified daily macro and calorie goals and Future date meal logging | 1. Guideline macros and calories to be calculated using entire meal plan's average instead of a single option | 2. Allowing food logging options for future dates (up to 6 weeks in advance) | 3. Showing instructions and ingredients of logged meals

- Food Diary (2025) (5212 chars)
  - URL: https://impact.macroactive.com/knowledge/how-food-dairy-looks-and-functions-for-your-customers
  - Encabezados: Features | Net Carbs | Can the customer log meals from different options? (mixing)? | Will the tracker work if I log a custom meal as the first meal? | Can a customer log meals from a previous meal plan? | Can a customer log meals from meal plan more than once a day? | Can a customer log multiple serving sizes when logging meals?

- 🥗 Updated Design for the Food Diary Widget (1775 chars)
  - URL: https://impact.macroactive.com/knowledge/updated-design-for-the-food-diary-widget
  - Encabezados: Help your customers stay on top of their macros more easily! | 🎨 Customize the Look to Match Your Brand | 🚨 New Color Alert When Your Customers Go Over Their Daily Targets

- Food Diary Macro Calculator (2257 chars)
  - URL: https://impact.macroactive.com/knowledge/food-diary-macro-calculator
  - Encabezados: Give your customers complete flexibility, without creating a meal plan | What the Food Diary Macro Calculator Does | How to Set It Up | Important: | What Your Customers Will Experience | Best Practices:

- Food Diary - Dining Out Integration (2626 chars)
  - URL: https://impact.macroactive.com/knowledge/food-diary-dining-out-integration

- Food Diary - Showing instructions and ingredients of logged meals (183 chars)
  - URL: https://impact.macroactive.com/knowledge/food-diary-showing-instructions-and-ingredients-of-logged-meals
  - Encabezados: This improvement will allow customers to view the instructions and ingredients of meals logged into their Food Diary.

- Manual Meal Swap (2098 chars)
  - URL: https://impact.macroactive.com/knowledge/manual-meal-swap
  - Encabezados: We’ve introduced a new way for you to control how meal swaps work for your customers, giving you full control over which meals they can choose from. | What’s new? | Why is this important? | How does it work?

- How to Add a Meal Category (2661 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-add-a-category
  - Encabezados: Adding a Meal Category

- New Feature: Set the Order of Meal Categories (686 chars)
  - URL: https://impact.macroactive.com/knowledge/defining-the-appearance-order-of-meal-categories-during-subscription-and-progress-update
  - Encabezados: With this improvement, you can define the order your meal categories appear for your members when they complete their details.

- Control the Number of Meal Plan Days for Each Category! (1026 chars)
  - URL: https://impact.macroactive.com/knowledge/control-the-number-of-meal-plan-days-for-each-category
  - Encabezados: More Flexibility & Control Over Your Meal Plans | What’s New? | How It Works:

- Control Dietary Options Based on Nutrition Goals (1178 chars)
  - URL: https://impact.macroactive.com/knowledge/control-dietary-options-based-on-nutrition-goals
  - Encabezados: Optimize Nutrition Programs & Challenges with Precision | How It Works | Why This Matters

- You can now Assign Unpublished Meal Categories When Manually Creating Meal Plans for your customers (2610 chars)
  - URL: https://impact.macroactive.com/knowledge/you-can-now-assign-unpublished-meal-categories-when-manually-creating-meal-plans-for-your-customers
  - Encabezados: You have the flexibility to assign unpublished meal categories (e.g., Keto, FODMAP, Low Carb) to individual customers without making them publicly available. | Why This Matters | How It Works | Key Benefits | FYI

- Meal Category Info to Educate Customers During Sign-Up or Progress Check-In (1678 chars)
  - URL: https://impact.macroactive.com/knowledge/meal-category-info-to-educate-customers-during-sign-up-or-progress-check-in-1

- Diet Preferences Explained (2840 chars)
  - URL: https://impact.macroactive.com/knowledge/diet-preferences-explained
  - Encabezados: Meal Category

- How to change a customers diet preference. (671 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-change-a-customers-diet-preference
  - Encabezados: Changing Diet Preference (Meal Category)

- How you can adjust meal generator settings to achieve a particular macronutrient split. (3391 chars)
  - URL: https://impact.macroactive.com/knowledge/nutrition-category-settings
  - Encabezados: Nutrition Category Settings

- How to add an Ingredient (1211 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-add-an-ingredient
  - Encabezados: Adding an Ingredient

- How to add a recipe into your platform. (2155 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-add-a-recipe-into-your-platform
  - Encabezados: Adding a Recipe

- Removing Meals from Customer Plans (1876 chars)
  - URL: https://impact.macroactive.com/knowledge/removing-meals-from-customer-plans
  - Encabezados: Learn how to unpublish meals to control what appears in customer meal plans. | Before You Unpublish: What to Know | How to Unpublish Meals:

- How to Add a Meal (1032 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-add-a-meal
  - Encabezados: Adding a Meal

- Easily Identifying Meals with Disliked Ingredients when Managing Meal Plans. (391 chars)
  - URL: https://impact.macroactive.com/knowledge/showing-blacklisted-meals-when-editing-a-members-meal-plan
  - Encabezados: This improvement will show (in red) meals that contain disliked ingredients. In this way, creators and support can avoid selecting meals with blacklisted ingredients when editing a member's meal plan.

- Smart Check-Ins (3629 chars)
  - URL: https://impact.macroactive.com/knowledge/smart-check-ins
  - Encabezados: New steps in Meal Plan progress update to improve calorie assignment in members' plans | What is this about? | Why it matters? | When manual input is needed?

- Show allergy/disliked meals when managing a meal plan (916 chars)
  - URL: https://impact.macroactive.com/knowledge/show-allergy/disliked-meals-when-managing-editing-a-meal-plan
  - Encabezados: Making it easy to identify meals with blacklisted ingredients when editing a member's meal plan.

- Request to Change Meal Plan (1702 chars)
  - URL: https://impact.macroactive.com/knowledge/meal-plan-change-request-questionnaire
  - Encabezados: What is it ? | Why it matters? | How it works? | Submitting a Request via Member's Area | Email Notifications

- Enhanced Meal Plan Management Tools (1281 chars)
  - URL: https://impact.macroactive.com/knowledge/improvement-to-meal-plan-content-page
  - Encabezados: We've made some key updates to streamline managing your customers' meal plans. | What’s New?

- Enable or Disable Automatic Meal Plan Renewals (1627 chars)
  - URL: https://impact.macroactive.com/knowledge/enable-or-disable-automatic-meal-plan-renewals
  - Encabezados: Take Full Control Over Meal Plan Renewals | What’s Changing? | How It Works | Why This Matters?

- Send Progress Updates Anytime for Meal & Fitness plans (1230 chars)
  - URL: https://impact.macroactive.com/knowledge/send-meal-plan-progress-updates-anytime
  - Encabezados: Now you can check in with your members whenever it’s needed—no need to wait for renewals. | ✅ What’s new? | 🔄 How it works | 🙌 Why this matters

- Can clients update their likes and dislikes before their update so the new meal plans will be up to date (595 chars)
  - URL: https://impact.macroactive.com/knowledge/can-clients-update-their-likes-and-dislikes-before-their-update-so-the-new-meal-plans-will-be-up-to-date
  - Encabezados: Dislikes

- How to Fix Meal Swap Generation Fail (1692 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-fix-meal-swap-generation-fail
  - Encabezados: Meal Swap Generation Fail

- How to Fix Nutrition Plan Generation Fail (2521 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-fix-nutrition-plan-generation-fail
  - Encabezados: Nutrition Plan Generation Fail | 1. The customer has chosen too many dislikes & allergy ingredients | 2. The macro settings for minimum protein or fat are set too high | 3. The meal category selected does not have enough meals (variety) | 4. The customer has entered the wrong data on sign up

- How to manage a customers meal plan (1900 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-manage-a-customers-meal-plan
  - Encabezados: Changing Customer Meals

- how to update a customers nutrition goal (986 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-update-a-customers-nutrition-goal
  - Encabezados: Changing a Customer Nutrition Goal

- How to change a customers activity level (3346 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-change-a-customers-activity-level
  - Encabezados: Changing Customer Activity Level

- How to update a customers meals per day (1159 chars)
  - URL: https://impact.macroactive.com/knowledge/how-to-update-a-customers-meals-per-day
  - Encabezados: Changing Number Of Meals Per Day

- Treat Meals (3195 chars)
  - URL: https://impact.macroactive.com/knowledge/how-treat-meals-works-and-how-to-enable-it-on-your-platform
  - Encabezados: Features | How to add Treat Meals | How to turn the feature on

- How customers can connect and pair meals in their meal plans. (7802 chars)
  - URL: https://impact.macroactive.com/knowledge/how-customers-can-connect-and-pair-meals-in-their-meal-plans
  - Encabezados: Meal Plan For Couples

- Introducing “Days of Meal Plan” (834 chars)
  - URL: https://impact.macroactive.com/knowledge/introducing-days-of-meal-plan
  - Encabezados: This feature improvement allows customers to choose how many days of meal plan they prefer from 2 days to 7 days, offering a wider range of options

- Favorite meals (4386 chars)
  - URL: https://impact.macroactive.com/knowledge/favorite-meals
  - Encabezados: What is it ? | Why it matters? | How it works? | Functionality | Favorite Meals: How They Work for Your Customers

- Meal Swap - 3 Options to choose from when swapping a meal (2418 chars)
  - URL: https://impact.macroactive.com/knowledge/meal-swap-2.0
  - Encabezados: Allowing members to choose what meal to receive when swapping a meal from their plan. | What Is It? | Why It Matters? | How it works? | How can I receive this feature?

- Flexible Meal Logging Is Here with Smart Add! (2737 chars)
  - URL: https://impact.macroactive.com/knowledge/log-any-meal-with-smart-add
  - Encabezados: Give your customers more flexibility and confidence when tracking their meals. | What’s New | Why This Matters to You | How It Works | Text Input | Image Scanner | Getting Started

- Reuse Previous Meals When Updating Meal Plans (2011 chars)
  - URL: https://impact.macroactive.com/knowledge/reuse-previous-meals-when-updating-meal-plans
  - Encabezados: What’s new? | Why is it important? | How does it work / How can I start using it? | 1. Enable the feature | What your customers will experience

## Estadisticas de extraccion

- URLs rastreadas: 241
- Errores tecnicos: 0
- Cola restante: 0
- Categorias principales: 9
- Articulos compartidos: 3
- Paginas extra no asignadas: 10
- Paginas no aprovechables: 2
