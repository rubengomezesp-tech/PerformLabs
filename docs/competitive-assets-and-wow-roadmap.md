# Competitive Assets And Wow Roadmap

## Objetivo

Convertir PerformLabs en una plataforma white-label premium para entrenadores:
app de cliente impecable, consola del entrenador potente y consola interna capaz
de operar muchas marcas sin mostrar la arquitectura al cliente final.

## Referencias Revisadas

- MacroActive: posicionamiento de marca propia, PWA, app iOS/Android, soporte,
  estrategia de contenido y acompañamiento de lanzamiento.
- ABC Trainerize: entrenamiento, nutricion, habitos, mensajeria, pagos,
  personalizacion de marca, video coaching e integraciones.
- Everfit: push por actualizaciones del trainer, recordatorios de workout,
  recordatorios de tareas y ajustes de hora por el cliente.

## Assets Que Debemos Igualar O Superar

### 1. App De Cliente

- Panel diario con accion principal clara.
- Entrenamiento con registro editable de reps, kilos, RIR, RPE, notas y progreso.
- Nutricion con macros, comidas, restricciones, swaps y lista de compra.
- Check-ins con peso, fotos, medidas, sensaciones y revision del coach.
- Centro de avisos: cambios del coach, recordatorios y mensajes in-app.
- Perfil con preferencias de comunicacion, privacidad y horarios.
- Experiencia mobile-first, rapida, sin lenguaje tecnico ni interno.

### 2. Consola Del Entrenador

- Miembros, estado, onboarding, plan activo y proxima revision.
- Programas trimestrales por 3, 4, 5, 6 y 7 dias/semana.
- Builder de rutinas por mes, semana y dia.
- Ejercicios con video propio por marca, tecnica, tempo, descanso y notas.
- Nutricion con MacroLab profesional y plantillas por objetivo.
- Recetas, ingredientes, alergias, preferencias y diet templates.
- Avisos: push, in-app, email, plantillas por evento y mensajes programados.
- Check-ins, feedback, tareas pendientes y cola diaria del coach.
- Branding, dominio, app name, soporte y contenido editable.

### 3. Consola Interna PerformLabs

- Leads, proyectos, briefing y checklist de implantacion.
- Creacion de app operativa desde proyecto.
- Control de licencias, modulos activos y seguridad.
- QA de lanzamiento: marca, dominio, contenido, ejercicios, nutricion, pagos,
  soporte, legal y mobile.
- Biblioteca global heredable: ejercicios, categorias, recetas y plantillas.
- Auditoria de cambios por workspace.

## Fases De Construccion

### Fase 1: Experiencia Core

- Dashboard de cliente con acciones del dia.
- Programas y logs de entrenamiento.
- MacroLab y plantillas nutricionales.
- Miembros y asignacion de planes.
- Avisos y preferencias de comunicacion.

### Fase 2: Retencion Y Seguimiento

- Check-ins reales con fotos, medidas y feedback.
- Metricas semanales: adherencia, volumen, peso, grasa, cumplimiento nutricional.
- Alertas inteligentes para coach: sin entrenar, check-in atrasado, peso estancado.
- Mensajes in-app y bandeja de conversaciones.

### Fase 3: Escala Comercial

- Pagos, productos, cupones y estados de acceso.
- Comunidad y contenido premium.
- Publicacion PWA, Google Play y Apple App Store.
- Integraciones: Stripe, proveedor push, storage de video, email transaccional.

## Proveedor Push Recomendado

Para web app/PWA y apps nativas hay tres caminos:

- OneSignal: rapido para PWA, iOS y Android, buen panel operativo.
- Firebase Cloud Messaging: tecnico, flexible y barato para Android/web.
- Expo/EAS Push: util si la app nativa se empaqueta con Expo.

Decision pendiente: elegir proveedor cuando definamos si la primera entrega va
como PWA avanzada, wrapper nativo o app nativa dedicada por cliente.
