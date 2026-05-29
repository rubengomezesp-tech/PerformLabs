# MacroActive - manual autosuficiente para Claude

Fecha de preparacion: 2026-05-29  
Origen: knowledge base autenticada de MacroActive, extraida desde la cuenta del usuario.  
Cobertura: 240 paginas revisadas. Este documento esta escrito para que Claude entienda el sistema sin abrir enlaces ni autenticarse.

## Como debe usar Claude este documento

Claude debe tratar MacroActive como una plataforma de negocio fitness compuesta por: una capa comercial, una capa de cobro, una capa de experiencia del miembro y dos motores de entrega: fitness y nutricion. Cuando el usuario pida construir, replicar, migrar, auditar o mejorar algo, Claude debe razonar desde esas relaciones, no desde articulos sueltos.

Regla mental principal:

1. El Product Plan define lo que el cliente recibe.
2. El Pricing Plan define como se compra y paga.
3. Stripe ejecuta y mantiene el cobro real.
4. El cliente completa datos de signup/check-in.
5. MacroActive genera o muestra workouts, meal plans, app pages, dashboard, community, chat y trackers segun el plan.
6. Sales > Subscriptions es el centro de soporte de clientes.
7. Los fallos casi siempre vienen de datos incompletos, restricciones demasiado estrechas, contenido insuficiente, configuracion de pricing/Stripe o acceso por plan.

## Mapa conceptual completo

### Entidades principales

- Brand: nombre publico del negocio, dominio, members area, sales page, support email, look & feel y app nativa si aplica.
- Customer/Member: usuario final que compra, completa onboarding, accede a dashboard/app y recibe planes.
- Subscription: relacion activa entre customer, product, pricing y estado de pago/acceso.
- Product Plan: paquete de contenido: meal plan, workout plan, page product, habits, chat/community u otras funciones.
- Pricing Plan: link comercial conectado a un Product Plan. Define precio, tipo de pago, ciclo, trial, activacion, cupones, checkout y reglas de acceso.
- Stripe Customer/Subscription: registro financiero real. MacroActive se apoya en Stripe para cobro, cancelacion, refund, cupones, disputas y reportes.
- Members Area/App: frontend del cliente con dashboard, planes, trackers, community, chat, food diary, video/content pages y billing info.
- Fitness Library: ejercicios, exercise types, workouts, programas, videos, tags, levels, locations y swaps.
- Nutrition Library: ingredients, recipes, meals, meal categories, macro settings, dislikes/allergies, food diary y meal generator.

### Dependencias importantes

- Un Pricing Plan sin Product Plan correcto vende mal el producto aunque Stripe cobre bien.
- Un Product Plan sin contenido suficiente puede venderse, pero la experiencia/generacion puede fallar o quedar pobre.
- Stripe puede cambiar precio/cobro, pero no siempre cambia el Product Plan entregado por MacroActive.
- El miembro puede estar pagado pero sin datos. En ese caso aparece el caso No Data/incomplete signup y no se generan planes hasta completar el formulario.
- Cambiar datos de cliente puede requerir regenerar workout o meal plan para que el cambio impacte realmente.
- Ocultar/mostrar calorias, macros, pages o products cambia la experiencia visible, no necesariamente la logica interna de calculo.
- Chat, community y algunos features pueden ser parte del valor de un plan; conviene activarlos por pricing/product segun la oferta.

## Secuencia recomendada para montar una plataforma

### 1. Setup tecnico y marca

1. Definir brand name, posicionamiento y nombre visible.
2. Confirmar dominio. Si ya existe, se entrega acceso al proveedor; si no existe, se registra uno nuevo.
3. Definir support email, normalmente tipo support@dominio.
4. Si hay Google Workspace creado por el equipo, activar billing cuando llegue la invitacion.
5. Si hay soporte gestionado por MacroActive, el equipo de soporte usa ese email para responder clientes.
6. Preparar assets creativos: fotos, guias visuales, look & feel mobile, imagenes de programa y contenido grafico.
7. Si hay app nativa, crear cuentas Apple Developer y Google Play Console separadas de cuentas personales y dar acceso admin a MacroActive.
8. Si se usa Klaviyo, aceptar invitacion, preparar lista, editar launch campaign, previsualizar y programar/enviar.

### 2. Setup financiero

1. Crear Stripe o usar una cuenta existente con cuenta adicional para la marca.
2. Dar acceso administrador a MacroActive cuando corresponda.
3. Configurar datos del negocio, cuenta bancaria, metodos de pago y monedas.
4. Decidir si se usara Stripe Checkout o checkout de plataforma.
5. Decidir si se necesita Stripe Tax y si los precios son tax included o tax excluded.
6. Activar payment methods en Stripe: cards, Apple Pay, Google Pay, SEPA, BNPL/Klarna u otros segun pais/checkout.
7. Configurar emails/retry policy para failed payments y renovaciones.

### 3. Contenido base

1. Crear categorias de nutricion y revisar settings de macros/calorias.
2. Crear o revisar ingredients, recipes y meals.
3. Crear workouts, exercises, exercise types, videos y tags.
4. Crear app pages o page products si se venden PDFs, videos, recipe pages, external resources o contenido educativo.
5. Crear community/chat si forman parte del valor del plan.
6. Preparar notifications, welcome messages y dashboard/bottom navigation.

### 4. Producto y venta

1. Ir a Products > Product Plans.
2. Crear Product Plan con los componentes exactos que se entregan: meal plan, workout, pages, habits, chat/community, etc.
3. Ir a Products > Plan Pricing.
4. Crear Pricing Plan asociado al Product Plan correcto.
5. Definir recurring o one-off, billing cycle, precio, trial, activation date, coupons y checkout.
6. Guardar y sincronizar con Stripe.
7. Probar el link como cliente nuevo: registration, payment, thank you, subscription settings/onboarding y members area.

### 5. Operacion continua

1. Usar Sales > Subscriptions como centro de soporte.
2. Buscar clientes por email.
3. Revisar estado de pago/acceso y datos de signup.
4. Gestionar meal/workout plans, progress updates, check-ins, pausas, cancelaciones y cambios de plan.
5. Usar Stripe para acciones financieras: refunds, coupon changes, failed payments, disputes y reports.
6. Verificar como ve el cliente la app usando acceso al members area del cliente cuando haga falta.

## Arquitectura comercial: Product Plans, Pricing Plans y acceso

### Product Plan

Un Product Plan representa el contenido real de la oferta. Ejemplos:

- Meal Plan + Workout Program.
- Meal Plan only.
- Workout only.
- Page product: PDFs, videos, recipe pages, accordion pages o recursos.
- Producto con chat, community, habits o features concretos.

La regla critica es que el Product Plan define entrega. Si un cliente necesita cambiar de meal+workout a meal only, eso es cambio de producto, no solo de precio.

### Pricing Plan

Un Pricing Plan crea el link comercial. Define:

- Nombre visible en registro.
- Product Plan asociado.
- Tipo: recurring subscription o one-off.
- Billing cycle: weekly, monthly, quarterly u otro.
- Precio y moneda.
- Trial si aplica.
- Activation Date si la entrega empieza en fecha futura.
- Coupons.
- Stripe Checkout o plataforma checkout.
- Reglas de acceso y visibilidad.

Cosas importantes:

- Una vez sincronizado con Stripe, el precio queda bloqueado. Para cambiar precio, clonar, cambiar nombre/codigo/precio y sincronizar un nuevo link.
- Los trials pueden existir en recurring, pero el material indica que se gestionan con Creator Success.
- Activation Date permite cobrar antes de que el plan empiece. En recurring, el segundo cobro toma como referencia la fecha de activacion.
- One-Time Offer es un upsell post-pago; en la version descrita sirve para page products.
- Un cliente cancelado o expirado puede conservar acceso limitado a paginas publicadas, My Journey y widgets read-only, pero no a los productos pagados si el producto esta oculto o la suscripcion recurring esta cancelada.

## Checkout y onboarding del cliente

El flujo normal del cliente es:

1. Entra al sales page o link de pricing.
2. Crea cuenta/registro inicial.
3. Paga en checkout.
4. Llega a thank you / registration success.
5. Completa formulario de subscription settings: datos fisicos, goal, activity level, preferencias, alergias/dislikes, workout location, nivel, etc.
6. MacroActive genera meal/workout plan segun el Product Plan.
7. Cliente entra al members area/app.

Riesgo principal: cliente paga pero no completa datos. En ese caso existe cuenta y pago, pero no hay informacion suficiente para generar planes. El soporte debe enviar el link unico para completar datos desde Sales > Subscriptions.

El redesigned checkout expone eventos por etapa para integraciones/CRM:

- registration page loaded: etapa de registro.
- payment page loaded: etapa de pago.
- thank you page loaded: confirmacion.
- subscription settings page loaded: onboarding post-compra.

## Stripe y pagos

### Cancelaciones y refunds

1. Abrir Stripe.
2. Buscar cliente por email.
3. Entrar al customer.
4. Para cancelar, ir a Subscriptions y cancelar. Recomendacion: al final del periodo pagado salvo que haya razon para cancelar inmediato.
5. Para refund, ir a Payments y reembolsar el pago concreto.
6. Confirmar en MacroActive que el estado de suscripcion/acceso se actualizo.
7. Una suscripcion cancelada no se reactiva como si nada: normalmente el cliente debe comprar de nuevo con un link, usando la misma cuenta si inicia sesion primero.

### Cupones

1. Crear cupon en MacroActive/Stripe segun el flujo disponible.
2. Para aplicar a un cliente existente, buscar customer en Stripe.
3. Usar Actions > Apply coupon o editar la subscription.
4. Para quitarlo, usar el icono de eliminar sobre el descuento de la subscription/customer.
5. Validar que afecta la siguiente factura o el periodo esperado.

### Failed payments

1. En Stripe, ir a Settings > Billing > Subscriptions and emails.
2. Activar emails de renovacion, tarjeta expirada y failed payment.
3. Elegir Smart Retries o custom retry policy.
4. La guia recomienda evitar acumulaciones de cobros que molesten al cliente; una politica comun es cancelar tras varios fallos y marcar invoice como uncollectible.
5. Revisar disputas y cancelacion automatica si se abre dispute.

### Stripe Checkout, payment methods y tax

- Stripe Checkout ayuda con 3DS, SEPA y metodos no mainstream.
- Se habilita a nivel de Pricing Plan.
- Payment methods ahora pueden gestionarse desde Stripe con mas autonomia.
- Stripe Tax requiere decidir tax included vs excluded, configurar registrations y revisar impacto en revenue/checkout.
- Para taxes, trabajar con asesor fiscal cualificado.

## Sales > Subscriptions: centro de soporte

Usar este modulo para:

- Buscar cliente por email.
- Abrir Manage.
- Acceder a su members area para ver lo que ve.
- Resetear password.
- Revisar si esta No Data/incomplete signup.
- Ver meal plans y workout programs.
- Regenerar planes fallidos.
- Pausar suscripcion.
- Revisar progress/check-ins.
- Cambiar datos de cliente como goal, activity level, diet preference, metric/imperial, workout location o meals per day.

SOP reset password:

1. Sales > Subscriptions.
2. Buscar por email.
3. Manage.
4. Abrir perfil/nombre del cliente.
5. Account Settings.
6. Escribir password nueva.
7. Save.
8. Enviar password al cliente por canal seguro.

SOP No Data:

1. Confirmar que el cliente pago y creo cuenta.
2. Ver que falta subscription data form.
3. Activar o revisar email de incomplete subscription.
4. Copiar link unico desde el customer/subscription.
5. Enviarlo al cliente para que inicie sesion y complete datos.
6. Confirmar generacion de planes.

SOP pausa:

1. Sales > Subscriptions.
2. Abrir cliente.
3. Usar Pause.
4. Elegir 1 a 8 semanas.
5. Confirmar que billing y acceso de pago quedan pausados.
6. Si se desea autoservicio, activar en Settings > Subscription Settings > Subscription Management.

## Members Area, app pages y experiencia del miembro

El members area es donde el cliente consume el producto. Puede incluir:

- Dashboard.
- My Journey.
- Workout program.
- Meal plan.
- Food Diary.
- Community.
- Chat.
- Trackers: habit, period, steps/progress.
- Billing info.
- Recipe pages.
- Video pages.
- Custom app pages.
- External pages/resources.

App Pages permite crear:

- External page: URL externa embebida, por ejemplo carpeta Google Drive, pagina web, Facebook group o soporte.
- Custom video content.
- Articles/blogs internos.
- Page products que pueden venderse como oferta principal u OTO.

La navegacion puede ajustarse con bottom navigation bar, dashboard variations y look & feel. Las calorias/macros pueden ocultarse o mostrarse segun el enfoque de coaching.

## Comunidad y chat

### Community

- All Member Community incluye miembros activos automaticamente.
- Permite feed, posts, comments, likes, nicknames, perfiles y reportes.
- Puede tener moderacion, posts fijados, menciones, video uploads y notificaciones.
- Puede enlazarse con pricing plans o acceso por plan.
- Sirve para engagement, accountability, social proof y retencion.

Buenas practicas:

1. Crear calendario de posts.
2. Mezclar wins, preguntas, retos, tips, recetas, recordatorios y celebraciones.
3. Usar progress photos/testimonios como social proof con permiso.
4. Moderar contenido reportado y suspender miembros si procede.
5. Activar notificaciones sin saturar.

### One-to-one chat

- Se habilita a nivel de pricing plan.
- Puede ser parte de plan VIP o upsell.
- Permite texto, archivos, imagen/video, voz, typing indicators, email/push notifications y asignacion a manager/coach.
- El coach puede marcar unread para seguimiento.

SOP chat:

1. Definir si el plan incluye chat.
2. Activarlo en el pricing plan/producto correcto.
3. Configurar email/push notifications.
4. Asignar miembros a manager/coach cuando hay equipo.
5. Revisar desde vista creator y vista member.

## Notificaciones

MacroActive maneja comunicaciones por email y push. Se usan para:

- Welcome messages.
- Incomplete signup.
- Subscription renewal reminders.
- Failed payments.
- Workout notes.
- Progress/check-in reminders.
- Community/chat notifications.
- Broadcast push messages.

SOP de notificaciones:

1. Identificar el evento.
2. Revisar plantilla/contenido.
3. Revisar destinatario o custom email destination.
4. Revisar condiciones de envio.
5. Probar con usuario/control.
6. Para push, verificar permisos y app/native setup.

## Fitness: como esta montado

### Modelo de datos fitness

- Exercise: unidad basica. Debe tener nombre, instructions/video, muscle group, exercise type, level, location, tags y prioridad si aplica.
- Exercise Type: clasificacion para organizar ejercicios.
- Workout: conjunto de ejercicios con sets, reps, duracion y estructura.
- Program: secuencia de workouts por semana/dia/mes.
- Static Workout: contenido definido manualmente, mas estable.
- Variable Workout: generacion basada en tags/criterios, mas flexible pero depende de biblioteca bien etiquetada.
- Workout Log: registro del cliente de sets/reps/metricas.
- Exercise Swap: reemplazo de ejercicio por alternativa compatible.

### Crear workouts y programas

1. Planificar en spreadsheet: dias por semana, semanas/meses, duracion, muscle groups, exercises, sets/reps, level y location.
2. Cargar exercises y videos antes de depender de generacion.
3. Crear exercise types y tags consistentes.
4. Crear workouts.
5. Asignar workouts/programas al Product Plan.
6. Publicar/unpublish segun este listo.
7. Probar generacion con perfiles de cliente representativos.

### Fallos de workout generation

Causas comunes:

- Falta ejercicio que coincida con muscle group requerido.
- Tags inconsistentes: priority, level, location.
- Cliente eligio Beginner pero el workout usa ejercicios Intermediate.
- Cliente eligio Home pero no hay ejercicios Home suficientes.
- Se retiro un ejercicio por lesion/equipo pero sigue disponible para futuras generaciones.

Resolucion:

1. Leer el error y localizar dia/ejercicio afectado.
2. Revisar que combinacion pide: muscle group + priority + level + location.
3. Crear ejercicio faltante o retaggear uno existente.
4. Bajar/cambiar prioridad o nivel si procede.
5. Editar manualmente el workout individual si es un caso puntual.
6. Regenerar y comprobar members area.

## Nutricion: como esta montada

### Formula base

La plataforma estima calorias con esta cadena:

1. BMR segun genero, edad, altura y peso.
2. BMR x activity level = maintenance calories.
3. Maintenance x nutrition goal factor = total calories.
4. Total calories se distribuyen en macros segun settings/categoria.
5. Meal generator intenta construir meals que encajen con calories/macros, restricciones y categoria.

### Modelo de datos nutricion

- Ingredient: alimento base con informacion nutricional.
- Recipe: combinacion de ingredientes con cantidades, instrucciones, tiempo e imagen. Incluso productos preparados pueden modelarse como recipe.
- Meal: comida usable en meal plan, asociada a categoria/opciones.
- Meal Category: tipo de dieta/categoria que el cliente elige o que se asigna, con min/max, dias, opciones y macro settings.
- Diet Preference: preferencia del cliente.
- Dislikes/Allergies: restricciones que reducen el universo de meals.
- Food Diary: registro flexible de comidas reales.
- Meal Swap: sustitucion de meal por otra opcion.
- Progress/Check-in: actualizacion periodica que puede renovar planes.

### Crear nutricion

1. Revisar categorias y objetivos nutricionales.
2. Configurar min/max de macros por categoria.
3. Crear/limpiar ingredients.
4. Crear recipes con cantidades, instrucciones, imagen y tiempo.
5. Crear meals y asignarlas a categorias.
6. Controlar orden de categorias durante signup/check-in.
7. Definir dias de meal plan por categoria.
8. Activar vegetarian/refeed si aplica.
9. Probar con perfiles de clientes: low calories, high calories, picky eater, allergies, keto/vegetarian, diferentes meals per day.

### Fallos de meal plan generation

Causas comunes:

- Demasiadas dislikes/allergies.
- Categoria con pocas meals.
- Min protein/fat demasiado alto.
- Datos de signup incorrectos, por ejemplo altura/peso.
- Calorias demasiado bajas/altas para las meals disponibles.
- Diet preference o category demasiado restrictiva.

Resolucion:

1. Revisar datos del cliente.
2. Revisar dislikes/allergies.
3. Revisar category min/max.
4. Añadir variedad de meals o mover a categoria mas general.
5. Bajar min protein/fat si bloquea el generador.
6. Seleccionar manualmente una meal y escalarla si es caso puntual.
7. Regenerar meal plan.

### Food Diary y meal swaps

- Food Diary permite registrar comidas, usar scanner, macro calculator, dining out, recipe pages y smart add.
- Meal Swap permite cambiar meals; versiones nuevas ofrecen varias opciones para escoger.
- Favorite meals y reuse previous meals ayudan a reducir repeticion.
- Treat Meals y pairing/connecting meals dan flexibilidad.
- Cuando un cliente pide cambio especifico, el coach puede gestionar desde Sales > Subscriptions > Nutrition Plans > menu de tres puntos > Manage Plan.

## Troubleshooting cookbook

### Cliente pago pero no ve plan

1. Buscar en Sales > Subscriptions.
2. Revisar si aparece No Data.
3. Si falta formulario, enviar link unico para completarlo.
4. Si hay datos, revisar failed to generate.
5. Corregir meal/workout constraints.
6. Regenerar.
7. Entrar como cliente para confirmar.

### Cliente quiere cambiar de plan

1. Distinguir cambio de precio vs cambio de producto.
2. Si solo es billing/price, modificar en Stripe si corresponde.
3. Si cambia contenido/Product Plan, cancelar actual y enviar link nuevo.
4. Pedir que inicie sesion antes de comprar con el nuevo link.
5. Confirmar acceso y entrega.

### Cliente quiere cancelar/refund

1. Gestionar en Stripe.
2. Decidir cancelacion inmediata o fin de periodo.
3. Procesar refund sobre payment concreto si procede.
4. Confirmar MacroActive.
5. Documentar razon para soporte/disputes.

### Cliente tiene lesion o no tiene maquina

1. Revisar workout individual.
2. Cambiar ejercicio con swap o edicion manual.
3. Revisar tags para que no vuelva a salir si debe excluirse.
4. Si el problema es recurrente, crear alternativas por location/level/muscle group.

### Cliente dice calorias demasiado altas/bajas

1. Revisar datos: edad, peso, altura, genero, activity level, goal.
2. Revisar categoria y macro settings.
3. Revisar si hay cambios recientes/check-in.
4. Ajustar daily calories o goal segun caso.
5. Regenerar o actualizar meal plan.

## Growth playbook resumido

El material de crecimiento enseña a vender programas fitness online mediante:

- Urgencia real: retos, fechas de inicio, plazas, bonos y deadlines.
- Instagram: Reels, Stories diarias, Highlights, Live, Live Rooms, engagement y relaciones.
- YouTube: fundamentos para contenido evergreen.
- Lead magnets: recursos gratuitos para captar email subscribers.
- Email funnel: secuencia de nutricion, prueba social, objeciones y venta.
- Testimonials/progress pics: social proof estructurado.
- Paid challenges: retos como producto de entrada o lanzamiento.
- Content calendar: planificar pilares, frecuencia y llamadas a la accion.
- Community group: usar comunidad para retention, wins y accountability.

Claude debe usar esta parte para diseñar embudos, lanzamientos, calendarios de contenido y ofertas, no para configurar la consola tecnica.

## SOPs rapidos para Claude

### Crear oferta nueva

1. Definir promesa y componentes.
2. Crear contenido: workouts, meals, pages, community/chat.
3. Crear Product Plan.
4. Crear Pricing Plan.
5. Conectar/sincronizar Stripe.
6. Probar checkout.
7. Probar onboarding y generation.
8. Revisar members area.
9. Lanzar con Klaviyo/Instagram/sales page.

### Auditar plataforma existente

1. Revisar dominios, support email, Stripe, payment methods y tax.
2. Revisar Product Plans y si coinciden con ofertas publicas.
3. Revisar Pricing Plans, links activos, precios y Stripe sync.
4. Revisar onboarding form y No Data cases.
5. Revisar fitness library: tags, levels, locations, videos, swaps.
6. Revisar nutrition library: categories, macro settings, recipes, meals, dislikes/allergies.
7. Revisar notifications y push.
8. Revisar community/chat si existen.
9. Revisar failed generation tabs y customer support backlog.

### Replicar MacroActive en otra app

Modelar tablas o dominios:

- users/customers.
- subscriptions.
- products/product_plans.
- pricing_plans.
- stripe_customers/subscriptions/payments.
- onboarding_answers.
- workouts/exercises/workout_programs.
- nutrition_categories/ingredients/recipes/meals/meal_plans.
- app_pages/content_pages/video_pages.
- community_posts/comments/reports.
- chat_threads/messages/assignments.
- notifications/templates/events.
- checkins/progress_updates.

La clave no es solo guardar datos: hay que reproducir las reglas de acceso, generacion, restricciones, billing state y estado de onboarding.


## Inventario autosuficiente - Fitness

Construccion y mantenimiento del producto de entrenamiento: workouts, programas, ejercicios, videos, swaps, logs, metricas, lesiones y fallos de generacion.

### Creator Success
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
  - En chat, validar que la funcionalidad este habilitada en el pricing plan y que el miembro/coach correcto tenga acceso.
- Temas internos cubiertos: Business Development.

### Onboarding
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Platform setup | Multimedia Assets | Know your Platform | Business growth tools | Mobile App.

### Checkout
- Que enseña: gestion del checkout, cobro y etapas de registro del cliente.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: payment_methods.

### Client Success Hub
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: Business tools | Business Tools.

### Technical Setup - Domain and Email
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Brand Name, Domain, and Support Email | Brand name | Domain | Support email.

### Financial Setup - Stripe
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Stripe is the financial platform we use for you to receive payments once your platform is up and running. Your Onboarding Specialist will guide you through the steps of setting up your Stripe account..

### Creative Content
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Usarlo como referencia de configuracion/soporte del modulo; revisar primero el objetivo, luego ajustar y probar como miembro.
- Temas internos cubiertos: Below are guides and requirements for your images and content. | Creative Call.

### Customer Journey - Onboarding Sign Up
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: The video below shows you the customer onboarding process for your app..

### Klaviyo Setup
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - Para setup tecnico, cerrar brand name, dominio y support email antes de lanzar.
- Temas internos cubiertos: Klaviyo is an e-commerce marketing automation platform, used primarily for email marketing and SMS marketing. We will create a Klaviyo account for you so that you can use this to set up your launch campaign. | 1. Log in to your Klaviyo account | 2. Create Campaign | 3. Edit Campaign | 4. Edit Your Launch Email Template | 5. Preview Launch Email | 6. Schedule and Send Your Launch Email | Upload Email Data.

### Developer Accounts
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: This step is for creators who sign up for a Full App product. Please follow our guide for instructions on how to create your developer accounts with Apple and Google. | Apple Developer Account | Step 1: Create an Apple ID | Step 2: Create an Apple Developer Account | Step 3: Enter your personal information | Step 4: Complete Purchase | Step 5: Give MacroActive access to your account | Google Developer Account.

### Integration Guide for Redesigned Checkout
- Que enseña: gestion del checkout, cobro y etapas de registro del cliente.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
  - Para launch marketing, crear campana en Klaviyo, elegir lista, editar plantilla, previsualizar y programar/enviar.
- Temas internos cubiertos: Executing Code Based on Different Stages of the Checkout | Impact on Current Thank You Page Code | Special Event for CRM Integrations.

### Calculate & Collect Sales Tax with Stripe Tax
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: MacroActive now integrates with Stripe Tax to help you calculate, collect, and report tax on global payments | Tax Included vs Excluded | Benefits and drawbacks of each option | Checkout experience of each option | Revenue impact between tax included and tax excluded | Enabling Stripe Tax | I. Visit the Stripe dashboard and access Tax settings. Click "Continue Tax Setup" to get started. | II. Add a registration.

### Manage your payment methods with ease!
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: We’re simplifying how you manage payment methods for your checkout experience..

### Evergreen Progress Pics - Turn Progress Photos into Social Proof
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: How it Works | For customers | For Creators.

### Show or Hide Calories & Macronutrients Across the Members’ Area
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Configure nutrition visibility in the Toning Environment; | How the Nutrition Information toggle worked before? | Members can configure nutrition visibility in the Member's Area; | Member Experience | The Meal Plan:.

### Welcome Messages
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: This new feature allows you to personalize the dashboard experience based on the pricing plan your customers purchased and where they are in their journey with you. | What’s New? | Why Is It Important? | Deliver Better Onboarding | Improve Engagement | Create Premium Experiences | Reduce Confusion | How Does It Work?.

### Keep the Device Screen On During Video Playback (Native App Only)
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: What it is? | Why it matters? | How it works?.

### Accessing the Creator App: A Guide for Creators
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
  - En chat, validar que la funcionalidad este habilitada en el pricing plan y que el miembro/coach correcto tenga acceso.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: What is it ? | How it works? | Option 1: Using the Member's Mobile App dedicated for Members. | Option 2: Using the Web Application dedicated for Members (Member's Area). | Community | Edit Member's Dashboard | Transformations | Product Updates.

### How to Enable Push Notifications for Your App?
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Configuring OneSignal Account via Creator Console | Features that Support Push Notifications.

### All member community
- Que enseña: gestion de comunidad de miembros: acceso, posts, moderacion, engagement y notificaciones.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: How to setup an all member community, what to expect and the community controls | Feature Overview | Creating the All Member Community | Accessing the Community | Accessing community via the Member's Area | Accessing the community via the Creator Console | Community Member count | Setting your community nickname.

### Community - Post Moderation Feature
- Que enseña: gestion de comunidad de miembros: acceso, posts, moderacion, engagement y notificaciones.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: The post moderation feature aims to enhance community management by requiring moderators to approve user-generated content before it is publicly displayed on the feed. | What it is | Why it matters | How it works:.

### Mention Members When Creating Posts or Replying to Comments in Community
- Que enseña: procedimiento para crear/configurar mention members when creating posts or replying to comments in community.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: How Tagging Works.

### Community - Linking with pricing plans
- Que enseña: gestion de comunidad de miembros: acceso, posts, moderacion, engagement y notificaciones.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
  - En chat, validar que la funcionalidad este habilitada en el pricing plan y que el miembro/coach correcto tenga acceso.
- Temas internos cubiertos: What is it? | Why it matters? | How it works? | Introducing Access Settings | When Community has been set to enabled by a pricing plan | When community access has been set to all active subscribers.

### Video Upload in Community for Posts & Comments
- Que enseña: gestion de comunidad de miembros: acceso, posts, moderacion, engagement y notificaciones.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Accessing Video Upload in Community Posts & Comments | Enabling the Feature via Toning Environment | FAQ❓.

### Pin Posts in Community for Creators
- Que enseña: gestion de comunidad de miembros: acceso, posts, moderacion, engagement y notificaciones.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Accessing "Pin Post" Feature in Community.

### Feature One to One Chat
- Que enseña: gestion del chat uno-a-uno entre creator/coach y miembros.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Feature overview; How to set up chat; Creator Chat view & Member Chat view | 1. Feature overview | 2. How to set up chat | 2.1. Enable chat | 2.2. Chat Email Notifications | 2.3. Chat Push Notifications | 3. Creator Chat view | 4. Member Chat view.

### Assigning Members to a Manager/Coach in Chat
- Que enseña: gestion del chat uno-a-uno entre creator/coach y miembros.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En chat, validar que la funcionalidad este habilitada en el pricing plan y que el miembro/coach correcto tenga acceso.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Assigning Members to a Manager/Coach in Chat in the Creator Console; | Push Notifications: | How Would it Change Chat for Members? | FAQs.

### Mark Messages as 'Unread' in Chat
- Que enseña: gestion del chat uno-a-uno entre creator/coach y miembros.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En chat, validar que la funcionalidad este habilitada en el pricing plan y que el miembro/coach correcto tenga acceso.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | How creators can mark the messages as unread via the Creator Console: | How creators can mark the messages as unread via the Creator App View: | How members can mark the messages as unread via the Member's Area:.

### Enable Video Slider on Dashboard Using Product Specific Video Page Content
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Accessing Video Slider via Member's Area | Enabling the Video Slider in Video Pages via Toning Environment.

### Delayed Video Content (dripping sequence)
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.

### My Journey
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Customer Progress Management | How it works for the customer: | Photo Journey: | How it works for the Trainer.

### Habit Tracker
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: This feature lets your members track progress on specific activities. You can assign habits individually or suggest habits for all members of a product plan. Members can also create and log their own habits. | Functionality | In members area | Managing habits | Habits created by members | Default habits you suggest to your customers | How to enable/disable this feature?.

### Period Tracker
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Features | How Period Tracker looks to your customers | Period Tracker Functionality | Setting up the Tracker | Logging a Period Manually | Editing the Cycle Length and Number of Period Days | How Period Predictions Work.

### Using the Step Tracker with Apple Health or Android Health Connect
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: What is it? | Why it matters? | How it works? | Accessing the Step Tracker via Member's Area for the First Time | Accessing the Step Tracker via Member's Area After Connecting with Apple Health or Android Health Connect | Enabling Step Tracker via Creator Console | ℹ️ Update Your Privacy Policy | FAQ:.

### Enable/disable Period Tracker via Member's Area
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: What is it? | Why it matters? | How it works? | Enabling/disabling Period Tracker via Member's Area | Enabling/disabling Period Tracker via Creator Console for All Female Members.

### On demand plan update for Customers
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: What’s new? | Why is it important? | How does it work? | Step 1: Enable the feature | Step 2: When does your customer see the option? | Step 3: Customer requests an update.

### Rolling out new Dashboard Design
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Better placement of plans, and quicker access to features | What is this about? | How does it work? | Considerations | Where do I set my workout plan thumbnail? | How can I get this update?.

### Let Your Customers Skip Progress Updates
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Now they can stick with the program they already know and love. | Why This Matters | How It Works for Your Customers | How to Enable It.

### Live Streaming with Your Members
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Configure Live Streaming in the Creator Console; | How Creators Go Live Using the in the NLAF Creator App View? | How Members Can Join the Live Stream Via Member's Area? | 🚫 Limitations of Live Streaming Feature (Phase 1):.

### Record & Replay Your Live Streams
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: What is it? | Why it matters | How it works? | Enable Live Streaming Recording for Creator | Record Live Streams as a Creator | View the Recorded Live Streams as a Member | FAQs.

### Workout Notes & Notifications
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: You can now easily track feedback your customers leave during workouts and get notified as soon as they do. | What’s new? | Why is this important? | How does it work?.

### Billing Information
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Accessing "Billing Information" via Member's Area (Web App) | Accessing "Billing Information" via Member's Area (Mobile App).

### Your Brand, Your Layout: Introducing Dashboard Variations
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Table of Content | What is it ? | Why it matters? | How it works? | Accessing "Edit Member Dashboard" via the Creator View in Member's Area | Dashboard Header Styles | Uploading the Dashboard Header Logo via Toning Environment | Intro Text Widget Styles.

### How to Log Meals Faster by Accessing Recipe Pages from the Food Diary
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works?.

### Invite a Friend
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Features | How to enable "Invite a Friend" on your platform | How trainers can keep track of successful referrals and referees?.

### Bottom Navigation Bar
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Creators can have a bottom navigation bar for their member's area to provide easier access to core features. | Overview | Bottom navigation bar | All-in-one workout plan page.

### How to create a Tawk.to account and attach to your platform
- Que enseña: procedimiento para crear/configurar a tawk.to account and attach to your platform.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: External Features | Adding to your Platform.

### Using Recipe Pages
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Accessing Recipe Pages via Member's Area | Configuring Recipe Pages via Creator Console.

### Broadcast Your Messages Using Push Notifications
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Configuring Push Notifications via Creator Console | FAQ:.

### How Fitness Creators Use Urgency To Sell More Programs (Fast!)
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - Para launch marketing, crear campana en Klaviyo, elegir lista, editar plantilla, previsualizar y programar/enviar.
- Temas internos cubiertos: Creating an urgency campaign can boost your membership numbers—and we’re going to show you exactly how to do that. | How To Create Urgency For Your Fitness Program | Here’s an example of what your promotional calendar can look like:.

### How To Launch an Instagram Workout Challenge
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Launching a challenge without a plan can be daunting, so we’ve put together 8 steps that you can follow to launch your first Instagram workout challenge confidently. | #1: Figure out what your challenge will be | #2: Make sure your social media supports that Challenge through your bio | #3: Create a content schedule to promote the Challenge | Your content schedule will look like this: | #4: Pre-record any content you need to promote the challenge and for the challenge itself | #5: Create all the necessary links and pages to be able to participate in the challenge | #6: Promote the challenge.

### How To Be a Leader In The Fitness Space
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: As a Fitness Creator, you’re more than just a trainer—you’re a huge reason for your client’s success. | What’s Your “Why” as a Fitness Creator? | How To Showcase Your Why in Your Branding.

### How To Set-Up Two Factor Authentication (And How It’ll Save You From Getting Hacked)
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: Getting your social media profiles hacked as a fitness trainer could mean spending weeks, months, or even years trying to grow back your audience. | Here’s how to set up two-factor authentication on Twitter, Facebook, and Google. | Instagram: | Twitter: | Facebook: | Google:.

### How To Set (And Reach) Your Fitness Business Goals
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Like any great goal, you need to have a plan that sets it into motion. As a business owner, you’re going to be dreaming up a lot of goals in the future—and you’ll need to be a master at turning those goals into plans so you can reach them. | How To Set Goals For Your Fitness Business | How To Reach Goals For Your Fitness Business | Ask yourself these questions to reverse engineer every goal you’re trying to reach:.

### How To Create a Paid Fitness Challenge for your Online Program
- Que enseña: procedimiento para crear/configurar a paid fitness challenge for your online program.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Fitness Creators know paid fitness challenges are a great way to grow their online business. Using them can create the ultimate hook that brings new members into their online program—growing their community and revenue. | What is a Paid Fitness Challenge? | How To Advertise a Personalized Paid Fitness Challenge | How To Keep Participants as Program Members.

### How To Price Your Online Fitness Program
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: In this article, we’re breaking down which trainers should price their programs less than $100pm and which trainers need to be pricing themselves over $100pm. | Low-Ticket Program | High-Ticket Program | It’s Not Actually About The Money.

### How To Increase Your Engagement Rate on Instagram
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Here’s how you can increase your engagement rate on Instagram so that you can turn your followers into members of your online program and community. | #1: Social Media is a Two-Way Street | #2: Use Stickers, Polls, Quizzes, and Other Engagement Features | #3: Giveaway Small or Big Prizes | #4: Ask Your Audience To Tag You In Their Stories.

### The YouTube Basics: Everything an Online Fitness Creators Needs To Know
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Fitness creators have already realized how to capitalize on YouTube, and we’ll show you why they’re doing it, how they know what to post, and how they’re turning it into revenue. | Why Fitness Creators Use YouTube To Grow Their Business | What To Post On YouTube as a Fitness Creator | How To Use YouTube To Make Money.

### How Fitness Creators Can Use Instagram Live with others
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: You won’t get left behind on this new feature because we’ve got you covered. Here’s how you can use Instagram Live Rooms as a fitness creator. | 3 Ways To Use Live Rooms (Starting Today!) | Go Live With Your Community | Collaborate With Other Fitness Creators | Kick-Off Program Launches and Events.

### How To Use Your Testimonials In Your Marketing Strategy
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Using testimonials on your social feed, in your stories, in your email campaigns and on website landing pages is one of the best ways to turn prospects into program members. | #1: Use Testimonials in Your Feed Posts | #2: Add Testimonials to Your Stories | #3: Place Testimonials Strategically in Your Email Campaigns | #4: Put Testimonials on Your Sales Pages | Sales pages should have two types of testimonials:.

### How To Create an Email Funnel for your Fitness Program
- Que enseña: procedimiento para crear/configurar an email funnel for your fitness program.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: By the end of this guide, you’re going to know how to set up an email funnel and where you can go for more help if you need it. | #1: Choose Your Email Platform | #2: Choose Your Offer | #3: Create a Lead Magnet | #5: Add Scarcity and Urgency to Purchase.

### Everything You Need To Know To Market Your Fitness Business
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: In this guide, we’re going to cover everything you need to know to market your fitness business properly. | How To Brand Yourself as a Fitness Creator | How To Grow Your Audience on Social Media | How To Create Engaging Posts | How To Turn Your Audience Into Paying Clients | How To Create Offers/Discounts For Your Program.

### How To Use Fitness Lead Magnets To Get More Email Subscribers
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Having Instagram followers is great—but having Instagram followers that are also email subscribers is the best-case scenario. But, how do you get your audience to become email subscribers? By using lead magnets..

### 5 Steps To Grow An Instagram Audience From Scratch
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Here are the 5 steps to grow an Instagram audience from scratch, so you can turn followers into members of your online fitness program. | Step #1: Get clear on who your ideal client is | Step #2: Create a content schedule | Step #3: Find your ideal clients and start talking to them | Step #4: Find micro-influencers to train and collaborate with | Step #5: Use best practices.

### An Introduction to Instagram Reels
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Let’s take a look at the basics around Instagram Reels so you know how to navigate this new feature and can start to brainstorm how you’re going to use it to grow your audience and get more members to your fitness program. | How To Use Instagram Reels.

### What to post in your members community group
- Que enseña: gestion de comunidad de miembros: acceso, posts, moderacion, engagement y notificaciones.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: It's vital you post in your members' community group on a regular basis and answer all of the questions they're asking. It lets your members know they're important to you and provides them with plenty of value..

### 25 Content Ideas For Fitness Creators
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: That’s why we’re going to give you twenty-five content ideas that you can use in your social media strategy. Ready to get posting? | Here are 25 content ideas for Fitness Creators to use on social media:.

### What to include in your daily Instagram Story
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: You should aim to share a variety of story posts every day based on the following topics: | 4+ story posts on exercises | 4+ story posts on food | 2+ story posts about supplements | 3+ daily life story posts | Share tagged stories | Ask me a question | Polls.

### The Fitness Influencer’s Ultimate Guide To Creating A Content Calendar (video)
- Que enseña: procedimiento para crear/configurar the fitness influencer’s ultimate guide to creating a content calendar (video).
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Every fitness influencer needs a content calendar. And every fitness creator started off thinking they didn’t. | 2. Coming Up With Content Ideas | Looking at other fitness accounts and seeing what their audiences are enjoying | Searching for commonly asked questions within your content and past client experiences | 4. How To Organize Your Content Calendar | 5. How To Automate Your Posting Schedule.

### How To Promote An Instagram Live Workout Series
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Instagram Live workouts are the fitness creators' version of a free sample. We’ll show you how to promote your Instagram Live workout series, in the below steps. | Step #1: Choose Your Date and Time.

### How To Create a Virtual Workout (And Promote It)
- Que enseña: procedimiento para crear/configurar a virtual workout (and promote it).
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: The fitness world has made an abrupt shift online - Moving your in-person workouts online can be a brand new learning curve of video software platforms, promotions, and marketing. Here are the five steps to creating a virtual workout. | Step #1: Choose Where You’ll Host It.

### How to use the Instagram highlights feature as a Fitness Creator
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: The benefits of using Instagram highlights | How to use Instagram highlights | Step 1: Decide what type of stories you want to highlight | Step 2: Create your highlight covers | Step 3: Post and highlight.

### How to build relationships on Instagram
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: Getting to know your audience and taking the time to engage with them will provide useful insights that you can use for your future content and marketing ideas. It will also make them more loyal to your brand long-term. Win, win! | How to engage with your Instagram audience.

### How To Create a Community Your Members Actually Care About
- Que enseña: procedimiento para crear/configurar a community your members actually care about.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: If you want to be one of these trainers, here is what you need to do to grow your community and keep members sticking around... | #1: Choose a platform where members can interact with you and each other | #2: Figure out what type of content you’re going to share | #3: Create a schedule and always be consistent | #4: Call people out and make members feel special | #5: Give them special discounts and prizes.

### How to use lead magnets on your Instagram
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: In this article, you will learn what a lead magnet is and how it can benefit your business when added to social platforms. | A lead magnet could be: | Benefits of a lead magnet | How to use a lead magnet on Instagram | Step 1: Create your lead magnet | Step 2: Share your lead magnet on Instagram.

### Customer at NODATA
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Customer plans showing 'no data' & 'due to expire' what does this mean?.

### How to access your customer's members area to see what they are seeing.
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: How to sign in as your customer.

### How to reset a customers password.
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Reset Customer Password.

### Editing Notifications
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: How to edit your notification emails sent to you & your customers..

### Custom email destination for event notifications
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - Para setup tecnico, cerrar brand name, dominio y support email antes de lanzar.
- Temas internos cubiertos: Creators can assign a custom email address as the destination for event notifications sent to them..

### How to customise notifications based on different conditions.
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Conditional Notifications | Setting up a Conditional Notification | Step 1: Create a conditional notification | Step 2: Configuring conditional notification | Placeholders | Default vs. Conditional Notifications Prioritization | Order of Conditional Notifications.

### How to Create a Master Password
- Que enseña: procedimiento para crear/configurar a master password.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Creating a Master Password.

### How to create different app pages within the platform. These include external URLs, custom video content, and articles/blogs.
- Que enseña: procedimiento para crear/configurar different app pages within the platform. these include external urls, custom video content, and articles/blogs..
- Como aplicarlo:
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Adding Custom App Pages.

### Setting activation delay
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Activation Delay.

### New File Manager in Console and PDF Handling Improvement
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Manage Your Files Directly Inside Your Creator Console | What’s This About? | Why Is This Important? | How Does It Work? | When Will I Get This?.

### Pausing Your Customers’ Subscriptions
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Give your customers flexibility when life gets in the way. | Why This Matters | How It Works for You | How It Works for Your Customers Check this Demo Video | Important Notes.

### Bottom Navigation Bar Customization
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: We’ve introduced new improvements that give you more control over what your customers see in the app’s bottom navigation bar. | What’s new? | Why is this important? | How does it work?.

### Push Notifications
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
  - Para app nativa, separar cuentas Apple/Google de uso personal y dar acceso admin a MacroActive.
- Temas internos cubiertos: Send Push Messages to Customers: | Attaching a Link to a Push Message.

### How to edit your front end look & feel
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Look and Feel Editor.

### Hiding Calories in the Member's Area
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### Customization for Body Fat % step in Toning
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: This improvement will make it possible for a Macroactive admin to customize images, ranges, and labels when setting up the body fat %. | What is this about? | Why it matters | How it works?.

### Improved Customer Checkins Page
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: We’ve improved the Customer Check-ins page to give you a clearer, more actionable view of your customers’ progress, all in one place. These updates are designed to help you quickly understand progress, spot trends, and take action when needed. | What’s new? | Clearer customer view Check this Video to see all changes in a nutshell. | Photos at a glance | Key progress metrics upfront | Latest activity | What data is included? | Updated labels.

### Coach Role Overhaul (In Plaform)
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: This update expands what the Coach role can do, making it far more useful as you grow and scale your business in 2026 and beyond. You can now involve coaches in more areas of your operation, without giving them access to sensitive financial or platform settings. | What’s this about? | What can your coaches access now? | Main menu access includes: | 🥗 Nutrition | 💪 Fitness | 💼 Sales | 🛠 Tools.

### How do I Change a customer from Metric to Imperial?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Change measurement system.

### How do I switch a customer to another subscription plan?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Changing subscriptions.

### How to change an individual customer's measurement system e.g. Metric -> Imperial.
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Changing a Customer's Measurement System.

### Failed to Generate Plans tabs
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: A quick way to find and manage meal and fitness plans that have failed to generate.

### Customer Checkins & Revamped Progress Data
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Introducing Customer Checkins and Progress Data page | Customers Checkins | Progress Data page.

### Filters for Subscription page
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.

### Account Delete option for Members
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Introducing a GDPR-compliant workflow to manage data deletion requests from members | Overview | How does it work? | How a member can request their data to be deleted | Other ways to access | Fulfilling the request - If support is handled by you.

### Creator's Notebook in Member Dossier
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Now You Can Add Notes When Reviewing Your Member's Progress | What’s New? | Why Does This Matter? | How Does It Work? | Key Features:.

### You Can Delete Your Customers’ Progress Entries
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
  - En chat, validar que la funcionalidad este habilitada en el pricing plan y que el miembro/coach correcto tenga acceso.
- Temas internos cubiertos: Provide full flexibility for your customers by removing any unwanted progress entries in just a few clicks. | What’s New? | Why It Matters | How It Works | Things to Keep in Mind.

### Remind Customers About Upcoming Subscription Renewal Payments
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Keep your disputes low by informing your customers of their upcoming subscription renewals. | Quick Walkthrough | Detailed Setup Guide.

### Stay Close to Your Customers’ Results with Smart Check-Ins
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: When your customers say they're not achieving results — you'll know right away! | Why This Matters | What This Notification Does | How to Enable This Notification | When can I start using this new notification?.

### Two customers have signed up with the same email. Now I have two seperate subscriptions sharing the same user data. How do I fix this?
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: 2 customers on the same data.

### I’ve had 2 people go to sign up, paid, but not complete the needed info, activity level, fitness goal etc. Am I able to enter this for them?
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Subscription Details.

### Customer would like to bring their update forward 2 days/extend 2 days. Is this possible and how?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Customer Management.

### Generation failures
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Can't generate plan for customer.

### How to fix customer No Data issue
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Incomplete Sign Up - No Data.

### Let Your Customers Change Their Plans on Their Own
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: We’ve introduced a self-service plan change feature that allows your customers to move between pricing plans on their own, without needing your help or support intervention. This gives your business more flexibility, helps your customers stay longer, and removes friction when they want to switch plans or billing cycles. | Why this matters for your business | What your customers can do | How to enable plan self-management | 1. Request this feature to us | 2. Set upgrade and downgrade options for your pricing plans | 3. What your customers see in their app | 3.1. Main menu.

### How to create a Product Plan.
- Que enseña: procedimiento para crear/configurar a product plan..
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
- Temas internos cubiertos: Creating a Product Plan (a product to sell) | Creating a Meal Plan only product | Creating a Workout only product.

### Can't Clone Pricing Plan
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
- Temas internos cubiertos: Pricing and Stripe.

### How to create a recurring pricing link with a trial period
- Que enseña: procedimiento para crear/configurar a recurring pricing link with a trial period.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
- Temas internos cubiertos: Creating a Trial Product.

### Can I change the price of an existing pricing link? Or do I need to create a new one?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
- Temas internos cubiertos: Pricing and Stripe.

### Minimum dollar value for pricing plans
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
- Temas internos cubiertos: Creators will be able to create pricing plans and coupon codes freely, however, an internal mechanism will make sure that no payment goes below the amounts stipulated in our T&Cs | Pricing Plan Creation | New info field.

### Defining "Activation Date" for pricing plans
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
- Temas internos cubiertos: Creators can select a custom date on a specific pricing plan. All members purchasing this pricing plan will receive their plan(s) on the same date..

### One Time Offer at checkout
- Que enseña: gestion del checkout, cobro y etapas de registro del cliente.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
- Temas internos cubiertos: This mechanism allows members to purchase an extra product without entering their card details again | What is it? | Why Does It Matter? | What can be sold as an upsell? | One-Click Upsell Flow Overview: | How to set up an upsell product? | Video Demo | Exclusions:.

### How to create a pricing plan
- Que enseña: procedimiento para crear/configurar a pricing plan.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
- Temas internos cubiertos: Creating a new pricing plan URL | It is not possible to create plans below the "Minimum Dollar Value" as long as the pricing is at least $3 USD (three American dollars) per week, or $0.4285 USD per day..

### I am running a sale and want to setup a weekly price for the first two weeks only, then go back to full price after 2 weeks. Is this possible?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Pricing and Stripe.

### How members area access works for end customers with expired/cancelled plans
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: All end customers will be able to login to their members area even when their plans are expired or cancelled. Therefore, they will have the ability to access 'My Journey' even after plan expiration or cancellation. | One off/challenge plans being cancelled/expired | Recurring plans being cancelled.

### How do I manage customers asking if they can sign up now but start their plan later on?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Custom Activation date.

### How to process a cancellation and/or refund in Stripe
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: This guide will show you how to perform customer cancellations and refunds within Stripe.

### How do I remove a coupon?
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Pricing and Stripe.

### How to Apply a Coupon to an existing customers account within Stripe
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: How to Apply a Coupon.

### Removing a coupon from a specific subscription
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.

### Cover customer disputes, and how to approach each.
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Customer Disputes.

### How to use and enable Stripe Checkout
- Que enseña: gestion del checkout, cobro y etapas de registro del cliente.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
- Temas internos cubiertos: Stripe Checkout.

### My customer's payment is declining when trying to purchase my program.
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Payment Declined.

### Failed Payments
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Dealing with Failed Payments and how to edit a retry schedule and activating email notification..

### How to pause customer subscription payments within Stripe
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Pausing Subscription Payments.

### Stripe supports Buy Now, Pay Later Payments with Klarna!
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Klarna is a popular Buy Now, Pay Later option available in Europe, Canada, Australia, New Zealand, the UK, and the US, Klarna lets customers choose to pay now, later, or in installments, depending on their location.

### How to change a customer to a different product or pricing plan
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Changing To A Different Product/Pricing Plan | Changing Customer To A Different Pricing Plan.

### How to generate financial reports in Stripe
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: This guide will explain how you can generate necessary reports in Stripe (e.g. for financial and accounting purposes).

### How to report on (and understand) Stripe Payments
- Que enseña: operacion de pagos en Stripe y su impacto sobre la suscripcion en MacroActive.
- Como aplicarlo:
  - Cuando interviene el cobro real, buscar/editar al cliente en Stripe por email y validar que MacroActive refleja el estado.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Viewing and understanding your Stripe payments, along with all associated fees..

### Publish/Unpublish workouts
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Bulk publish/unpublish, View published/unpublished only, Find where are workouts being used..

### How to clone a workout
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Clone an Existing Workout.

### How to structure and input exercises & custom workouts into your platform.
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: In this guide we will cover how to structure and input custom workouts into your platform. | How To Create Workouts.

### How to create a fitness program
- Que enseña: procedimiento para crear/configurar a fitness program.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Fitness (Building Programs & Products) | How To Create a Fitness Product.

### How to edit a workout
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Edit an Existing Workout.

### How To Create Workouts
- Que enseña: procedimiento para crear/configurar workouts.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: To create a new workout on the system, follow these steps; | Entering the exercises into Workouts; | Static Example | Variable Example.

### Exercise Library: Add value to your fitness product!
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: This is a new app page that you can monetize or add to your current plans. | What’s new? | Why is this important for you? | Increase perceived value of your programs | Empower your customers | Reuse your existing content | Control access by plan | How does it work?.

### Adding Exercises
- Que enseña: procedimiento para añadir exercises al sistema.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: In this guide we will cover how to input exercises into your platform..

### Adding Exercise Types
- Que enseña: procedimiento para añadir exercise types al sistema.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: In this guide we will cover how to input exercise types into your platform and their functionality. | Functionality of a Super Set & Giant Set vs. Normal Set.

### Phasing out P priorities
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: We're excited to introduce the ability to create your own "exercise types" for organizing your exercises. You can now create custom tags, such as compound, isolated, or bodyweight, instead of relying on the previously fixed P1-P10 labels. | Why it matters: | How it works? | Introducing exercise types section | Exercise Types when creating/editing an exercise | Priorities when creating/editing a workout | What Happens to My Existing Workouts with P1-P10 Priorities? | How can I enable this feature?.

### Swap Exercises in Static Workouts
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Give your members the flexibility they’ve been asking for—now in all workout types. | 💡 What’s new? | 🤔 Why this matters to you | 🔄 How swaps work in static workouts | 🏠 Location flexibility built-in | 🔧 Control this feature from your settings.

### Exercise Swaps Now Apply to the Entire Plan
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Save time and give your clients a more personalized experience | What’s new? | Why this matters to you | How it works | When can you start using this?.

### How exercise swap is enabled and how it is implemented within your platform
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Exercise Swap.

### Filming Your Workouts
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.

### How to Input Exercise Videos into your Platform.
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Uploading Videos to New or Existing Exercises | Uploading/Replacing new videos for existing exercises.

### Flexible workout log - ability to add additional sets
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: What it is? | Why it matters? | How it works? | How can I receive this feature?.

### Workout Log
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Features.

### What are Metrics?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Workout Log Metrics.

### How to change a customer workout location
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Changing a customer workout location.

### Injury Notification: Stay Ahead & Keep Your Customers Safe
- Que enseña: configuracion de comunicaciones: emails, push notifications y eventos.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Plan Pricing para crear o clonar links de precio.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: A smarter way to respond to customer injuries before a plan goes live. | What’s New? | With this update: | How It Works | Considerations | When Can You Start Using This?.

### How to edit an existing workout in your platform
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Edit an Existing Workout | Edit an Exercise and apply this change to all weeks of the period..

### Generating a new workout program
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: How to generate a new workout program for a customer.

### Can't generate a workout program
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Trouble Shooting - workout generation fail.

### Customer has hand injury and can't perform weighted exercise (Incomplete)
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Workout Programs.

### I have removed an exercise from a clients plan due to injury. How can I stop this exercise being pulled though on their next workout plan?
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Injuries.

### If a client who already has their training programs wants a day added (from 4 to 5 days) do I have to regenerate a whole new program? Or can I just add a day?
- Que enseña: conocimiento operativo del area Fitness.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: Customer Management.

### Customer gym doesn't have machine to perform exercise
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Workout Program changes.

### How you can fix workout plan generation failures & what they mean.
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Workout Program Generation Fail | 1. Platform can't find an appropriate exercise for the workout | 2. Customer has selected 'beginner'. Static workout contains 'intermediate' exercises | 3. Customer has selected wrong workout location.

### How to edit an existing workout program for a customer
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Editing an existing workout program.

### How to change a customers workout goal
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: Changing Customer Goal.


## Inventario autosuficiente - Nutrition

Construccion y mantenimiento de nutricion: calorias, macros, categorias, ingredientes, recetas, meals, food diary, swaps, check-ins y fallos de meal plan.

### 🥗 Say Goodbye to Repetitive Meals: Introducing Variety Tags in Meal Generator
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: What’s This About? | Why It Matters | What’s New? | ✅ Here’s the best part: | How to Use or Edit Variety Tags | Important to Know | How to Activate Variety Tags in the Meal Generator.

### Overview of the Nutrition Aspect of Your Platform and How to Customise It
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Nutrition Overview | How the Platform Determines a Customer's Calorie Requirements | How the Nutrition Platform works | Navigating the Nutrition on your Platform | Removing Nutrition from the Platform | Nutrition Category Settings | Changing Macronutrient Splits | Refeed Day & Vegetarian Day Options.

### Changing Macronutrient Distributions:
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### One client asked if there was a record of his prior nutritional plan as he had purchased food for it prior to it refreshing. Is there? And can it be exported?
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Meal Plan.

### Customer dislikes appearing in meal plan
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Trouble Shooting.

### The caloric requirements for one of my customers is too low or too high, how do I change this? Why did this occur?
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Nutrition.

### Show Nutrition FAQ section
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Answers to guide your customers:.

### What is a Keto diet? And what are the pros & cons of a Keto diet?
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Usarlo como referencia de configuracion/soporte del modulo; revisar primero el objetivo, luego ajustar y probar como miembro.

### Net Carbohydrate Function (& why nutritional information does not equal manual calculations c*4, p*4 + f*9).
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Net Carbohydrate Function.

### Why do my calories/macros vary between options (days)?
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### How we determine calories
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Maintenance Calories x Nutrition Goal = the total calories that the meal plan is generated from..

### Why are my calories too low/too high?
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### What goal to select (cutting or bulking)?
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Usarlo como referencia de configuracion/soporte del modulo; revisar primero el objetivo, luego ajustar y probar como miembro.

### Keto FAQ
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Usarlo como referencia de configuracion/soporte del modulo; revisar primero el objetivo, luego ajustar y probar como miembro.

### Using Condiments in Conjunction with your Meal Plan
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### Why are the calories on my plan not adding up correctly to “MyFitnessPal”?
- Que enseña: procedimiento para añadir why are the calories on my plan not adding up correctly to “myfitnesspal”? al sistema.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.

### Additional Protein Shakes Explained
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Usarlo como referencia de configuracion/soporte del modulo; revisar primero el objetivo, luego ajustar y probar como miembro.

### What is the best diet for me?
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Usarlo como referencia de configuracion/soporte del modulo; revisar primero el objetivo, luego ajustar y probar como miembro.

### Macronutrients Explained
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### A Complete Guide on Substituting Meals/Food Items
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Substituting Meals/Food Items.

### How to adjust a customers daily calories, and the reasons why they might be too high/low
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Changing Customer Calories.

### How to enable Vegetarian and Refeed Days for your nutrition categories.
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Vegetarian & Refeed Days.

### How you can adjust category Min/Max settings to achieve your desired macro split
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: How to Reduce Macronutrient Variation.

### Nutrition Label Scanner for Food Logging
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: 1) What’s new? | 2) Why is it important? | 3) How does it work? | 📍 Scenario 1: Barcode scan fails ( for supported countries) | 🌍 Scenario 2: No barcode scanner available (Other countries) | How can I get this feature? | ✅ What your customers can expect.

### Food Diary improvements (oct-nov, 2023)
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Simplified daily macro and calorie goals and Future date meal logging | 1. Guideline macros and calories to be calculated using entire meal plan's average instead of a single option | 2. Allowing food logging options for future dates (up to 6 weeks in advance) | 3. Showing instructions and ingredients of logged meals.

### Food Diary (2025)
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Features | Net Carbs | Can the customer log meals from different options? (mixing)? | Will the tracker work if I log a custom meal as the first meal? | Can a customer log meals from a previous meal plan? | Can a customer log meals from meal plan more than once a day? | Can a customer log multiple serving sizes when logging meals?.

### 🥗 Updated Design for the Food Diary Widget
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Help your customers stay on top of their macros more easily! | 🎨 Customize the Look to Match Your Brand | 🚨 New Color Alert When Your Customers Go Over Their Daily Targets.

### Food Diary Macro Calculator
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Give your customers complete flexibility, without creating a meal plan | What the Food Diary Macro Calculator Does | How to Set It Up | Important: | What Your Customers Will Experience | Best Practices:.

### Food Diary - Dining Out Integration
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### Food Diary - Showing instructions and ingredients of logged meals
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: This improvement will allow customers to view the instructions and ingredients of meals logged into their Food Diary..

### Manual Meal Swap
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: We’ve introduced a new way for you to control how meal swaps work for your customers, giving you full control over which meals they can choose from. | What’s new? | Why is this important? | How does it work?.

### How to Add a Meal Category
- Que enseña: procedimiento para añadir a meal category al sistema.
- Como aplicarlo:
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Adding a Meal Category.

### New Feature: Set the Order of Meal Categories
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: With this improvement, you can define the order your meal categories appear for your members when they complete their details..

### Control the Number of Meal Plan Days for Each Category!
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: More Flexibility & Control Over Your Meal Plans | What’s New? | How It Works:.

### Control Dietary Options Based on Nutrition Goals
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Optimize Nutrition Programs & Challenges with Precision | How It Works | Why This Matters.

### You can now Assign Unpublished Meal Categories When Manually Creating Meal Plans for your customers
- Que enseña: procedimiento para crear/configurar you can now assign unpublished meal categories when manually creating meal plans for your customers.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: You have the flexibility to assign unpublished meal categories (e.g., Keto, FODMAP, Low Carb) to individual customers without making them publicly available. | Why This Matters | How It Works | Key Benefits | FYI.

### Meal Category Info to Educate Customers During Sign-Up or Progress Check-In
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.

### Diet Preferences Explained
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Meal Category.

### How to change a customers diet preference.
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: Changing Diet Preference (Meal Category).

### How you can adjust meal generator settings to achieve a particular macronutrient split.
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Nutrition Category Settings.

### How to add an Ingredient
- Que enseña: procedimiento para añadir an ingredient al sistema.
- Como aplicarlo:
  - Punto de entrada habitual: Products > Product Plans para definir que contenido recibe el cliente.
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
- Temas internos cubiertos: Adding an Ingredient.

### How to add a recipe into your platform.
- Que enseña: procedimiento para añadir a recipe into your platform. al sistema.
- Como aplicarlo:
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Adding a Recipe.

### Removing Meals from Customer Plans
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Learn how to unpublish meals to control what appears in customer meal plans. | Before You Unpublish: What to Know | How to Unpublish Meals:.

### How to Add a Meal
- Que enseña: procedimiento para añadir a meal al sistema.
- Como aplicarlo:
  - Para crear registros nuevos se usa normalmente el boton azul + / Add new.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: Adding a Meal.

### Easily Identifying Meals with Disliked Ingredients when Managing Meal Plans.
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: This improvement will show (in red) meals that contain disliked ingredients. In this way, creators and support can avoid selecting meals with blacklisted ingredients when editing a member's meal plan..

### Smart Check-Ins
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: New steps in Meal Plan progress update to improve calorie assignment in members' plans | What is this about? | Why it matters? | When manual input is needed?.

### Show allergy/disliked meals when managing a meal plan
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Making it easy to identify meals with blacklisted ingredients when editing a member's meal plan..

### Request to Change Meal Plan
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Submitting a Request via Member's Area | Email Notifications.

### Enhanced Meal Plan Management Tools
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: We've made some key updates to streamline managing your customers' meal plans. | What’s New?.

### Enable or Disable Automatic Meal Plan Renewals
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Take Full Control Over Meal Plan Renewals | What’s Changing? | How It Works | Why This Matters?.

### Send Progress Updates Anytime for Meal & Fitness plans
- Que enseña: gestion del modulo fitness: programas, ejercicios, videos, swaps, logs o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Now you can check in with your members whenever it’s needed—no need to wait for renewals. | ✅ What’s new? | 🔄 How it works | 🙌 Why this matters.

### Can clients update their likes and dislikes before their update so the new meal plans will be up to date
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Dislikes.

### How to Fix Meal Swap Generation Fail
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Meal Swap Generation Fail.

### How to Fix Nutrition Plan Generation Fail
- Que enseña: guia de troubleshooting: detectar la causa, corregir configuracion/datos y volver a probar.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - Verificar que la notificacion este activa, tenga destinatario correcto y el cliente tenga permisos si es push.
- Temas internos cubiertos: Nutrition Plan Generation Fail | 1. The customer has chosen too many dislikes & allergy ingredients | 2. The macro settings for minimum protein or fat are set too high | 3. The meal category selected does not have enough meals (variety) | 4. The customer has entered the wrong data on sign up.

### How to manage a customers meal plan
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Changing Customer Meals.

### how to update a customers nutrition goal
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: Changing a Customer Nutrition Goal.

### How to change a customers activity level
- Que enseña: conocimiento operativo del area Nutrition.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Changing Customer Activity Level.

### How to update a customers meals per day
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Punto de entrada habitual: Sales > Subscriptions, buscar al cliente por email y abrir Manage.
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
- Temas internos cubiertos: Changing Number Of Meals Per Day.

### Treat Meals
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Features | How to add Treat Meals | How to turn the feature on.

### How customers can connect and pair meals in their meal plans.
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Meal Plan For Couples.

### Introducing “Days of Meal Plan”
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: This feature improvement allows customers to choose how many days of meal plan they prefer from 2 days to 7 days, offering a wider range of options.

### Favorite meals
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - Si hay generacion de planes, revisar restricciones/datos, corregir y regenerar.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: What is it ? | Why it matters? | How it works? | Functionality | Favorite Meals: How They Work for Your Customers.

### Meal Swap - 3 Options to choose from when swapping a meal
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
- Temas internos cubiertos: Allowing members to choose what meal to receive when swapping a meal from their plan. | What Is It? | Why It Matters? | How it works? | How can I receive this feature?.

### Flexible Meal Logging Is Here with Smart Add!
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En fitness, revisar workout, exercise tags, level, location, muscle group, priority y videos.
- Temas internos cubiertos: Give your customers more flexibility and confidence when tracking their meals. | What’s New | Why This Matters to You | How It Works | Text Input | Image Scanner | Getting Started.

### Reuse Previous Meals When Updating Meal Plans
- Que enseña: gestion del modulo nutricion: calorias, macros, categorias, recetas, meals, food diary o generacion.
- Como aplicarlo:
  - Guardar cambios y, si aplica, sincronizar con Stripe antes de probar el link o flujo.
  - Despues de cambiar algo del cliente, comprobarlo desde la vista del miembro o su dashboard.
  - En nutricion, revisar categoria, calories/macros, dislikes/allergies, recipes/meals y datos del cliente.
  - En comunidad, validar acceso por plan, moderacion, visibilidad de posts y notificaciones.
- Temas internos cubiertos: What’s new? | Why is it important? | How does it work / How can I start using it? | 1. Enable the feature | What your customers will experience.



## Cobertura y limites

- Paginas extraidas: 240.
- Paginas utiles en inventario: 229.
- El documento evita depender de URLs externas.
- Algunos articulos del portal contenian videos o imagenes; aqui se resume la logica operativa y no los assets visuales.
- No se guardan credenciales en este documento.
