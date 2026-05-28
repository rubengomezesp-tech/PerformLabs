# Arbol de Producto y Fases PerformLabs

## Vision

PerformLabs debe operar tres superficies separadas:

- **PerformLabs Console (`/console`)**: consola interna de la empresa para leads, implantaciones, marcas, dominios, soporte, seguridad, publicacion y calidad.
- **Coach Console (`/coach`)**: consola propia de cada entrenador para gestionar su app, miembros, entrenamientos, nutricion, contenido, check-ins, avisos y marca.
- **Member App (`/app`)**: app final del cliente del entrenador, con entrenamiento, comidas, progreso, cardio, guias, soporte y perfil.

La regla principal es que todo lo que el coach cambie en `/coach` debe reflejarse en `/app` dentro de su workspace, sin exponer la consola interna de PerformLabs.

## Arbol Que Hay Que Construir

### 1. Identidad y Acceso

- Workspaces por entrenador.
- Roles: `platform_owner`, `agency_admin`, `coach_admin`, `coach_staff`, `member`.
- Marca editable por workspace: nombre, app name, logo, color, soporte, dominio publico y dominio de miembros.
- Dominio publico: `tumarca.com`.
- Dominio de miembros: `miembros.tumarca.com`.
- Fallback tecnico: `marca-blanca.performlabs.app`.
- Separacion de permisos entre `/console`, `/coach` y `/app`.

### 2. Miembros

- Lista de clientes.
- Estado de acceso y suscripcion.
- Plan asignado.
- Coach responsable.
- Progreso, check-ins y actividad.
- Acceso a vista de cliente para soporte.

### 3. Entrenamiento

- Biblioteca de ejercicios.
- Videos por ejercicio.
- Grupos musculares, equipamiento, lesiones y ubicacion.
- Programas.
- Semanas, dias y sesiones.
- Series, reps, descanso, tempo, notas y sustituciones.
- Asignacion a miembros.
- Registro visible en app cliente.

### 4. Nutricion

- Ingredientes.
- Recetas.
- Comidas.
- Categorias, cocinas, restricciones, alergias y tags.
- Plantillas de dia completo.
- Planes asignados por miembro.
- Macros y ajustes.

### 5. Check-ins y Progreso

- Fotos.
- Peso, medidas, grasa, notas y adherencia.
- Resultado conseguido / no conseguido / mantenimiento.
- Cola de revision para el coach.
- Generacion o actualizacion de plan.

### 6. Productos y Pagos

- Planes de producto.
- Planes de precios.
- Cupones.
- Suscripciones.
- Estado de acceso.
- Renovacion, expiracion y pausas.

### 7. Contenido y App

- Paginas de app.
- Guias.
- Banners.
- Mensajes de bienvenida.
- Mensajes de app.
- Biblioteca de video y archivos.
- Notificaciones push.

### 8. Automatizacion y Algoritmo

- Generador de entrenamientos por objetivo, nivel, dias, equipo y lesiones.
- Generador de comidas por macros, objetivo, preferencias, alergias y comidas por dia.
- Alertas de miembros en riesgo.
- Recomendaciones de actualizacion de plan.
- Analitica de adherencia.

## Fases de Construccion

### Fase 1: Entrenamiento conectado

Objetivo: que el coach cree programas en `/coach/programs` y el miembro los vea en `/app/workouts`.

- Leer programas reales por workspace.
- Crear programa.
- Crear dias de entrenamiento.
- Anadir ejercicios a dias.
- Revalidar app cliente.
- Pulir vista de `/app/workouts`.

### Fase 2: Nutricion conectada

Objetivo: que el coach gestione comidas/recetas y el miembro vea su plan en `/app/meals`.

### Fase 3: Miembros y asignaciones

Objetivo: asignar programas y planes de comida a miembros concretos.

### Fase 4: Check-ins

Objetivo: que el miembro envie progreso y el coach lo revise desde `/coach/checkins`.

### Fase 5: Marca y contenido editable

Objetivo: que el coach actualice contenido y ajustes visibles sin tocar `/console`.

### Fase 6: Algoritmos

Objetivo: generar y ajustar planes con reglas propias de PerformLabs.
