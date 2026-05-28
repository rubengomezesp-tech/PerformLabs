# Blueprint De Trainer Console

Referencia funcional estudiada desde la consola de entrenador de MacroActive.
No se copia código. Se usa como mapa de producto para construir una versión propia.

## Estructura Principal

La consola se organiza en bloques:

- Cuentas
- Ajustes
- Nutrición
- Fitness
- Productos
- Ventas
- Área de miembros
- Herramientas
- Chat
- Community
- Knowledge Base
- Nutrition Agent
- Product Updates

## Cuentas

### Equipo

Tabla de staff con:

- Nombre
- Apellido
- Email
- Rol
- Acciones: editar, desactivar/impersonar según permisos

Roles vistos:

- Manager
- Coach

### Clientes

Tabla filtrable con:

- Nombre
- Apellido
- Email
- Estado
- Filtros por género y estado
- Exportación
- Acciones rápidas por cliente

## Ajustes

### General

Controla la app de cliente:

- Logo
- Favicon
- Imagen de encabezado por defecto
- Nombre de marca
- Email de soporte
- Sitio web público
- URL de reactivación de membresía
- Área de miembros
- Contraseña maestra para entrar como cliente
- Carbohidratos netos visibles o no
- Foto de usuario por defecto
- PWA: habilitado, nombre corto, descripción, theme color, background color, icono 512

### Subscripción

Controla onboarding y reglas de acceso:

- Demora mínima y máxima de activación
- Sistema de medición por defecto
- Género por defecto
- Habit tracker on/off
- Period tracker on/off
- Pregunta de grasa corporal on/off
- Saltar progress update on/off
- Edad mínima
- Permitir pausa de suscripción

### Fitness

Controla experiencia de entrenamiento:

- Swaps de ejercicio
- Swaps estáticos
- Audio de ejercicio
- Campo de lesiones
- Workout log
- Actualizaciones fitness bajo demanda

### Nutrition

Controla experiencia de comida:

- Campo de cocina preferida
- Campo de recetas preferidas
- Campo alergias/no me gusta
- Mostrar nombre de producto/plan
- Permitir ajustar plan
- Variety tags
- Actualizaciones nutricionales bajo demanda

### Notificaciones

Sistema de eventos con email/push:

- Customer account created/activated/deactivated
- Payment succeeded/failed
- Progress update due/overdue
- Meal swap generation succeeded/failed
- Exercise swap request
- Journey photo uploaded
- Nutrition plan activated/generation failed
- Community moderation/reports
- Account delete requests

Cada evento tiene estado por canal y edición de contenido.

## Nutrición

Submódulos:

- Comidas
- Tipos
- Categorías
- Cocinas
- Recetas
- Ingredientes
- Grupos
- Unidades
- Tags

Esto implica que nuestra plataforma operativa debe tener:

- Taxonomías globales
- Taxonomías clonables por app de cliente
- Ingredientes con macros
- Recetas con ingredientes
- Categorías como sin gluten, vegana, alta proteína, definición, volumen
- Unidades configurables
- Tags para variedad, restricciones y filtros

## Fitness

Submódulos:

- Productos fitness
- Programas
- Sesiones
- Metas
- Entrenamientos
- Workout Builder
- Tipos
- Ejercicios
- Grupo de ejercicios
- Exercise Types / patrones de movimiento
- Lesiones
- Bulk Video Uploader

Esto implica:

- Biblioteca base de ejercicios
- Vídeos base
- Vídeos propios por app de cliente
- Carga masiva de vídeos
- Builder de rutina
- Program sets
- Filtros por objetivo, sesión, género, semanas y días
- Reglas por lesión y swaps

## Productos Y Ventas

Submódulos:

- Planes de producto
- Planes de precios
- Cupones
- Suscripciones

Nuestra versión debe separar:

- Producto comercial
- Precio
- Suscripción del miembro
- Cupón
- Acceso a módulos

## Área De Miembros

Submódulos:

- Páginas de aplicaciones
- Look and feel
- Banners
- Welcome messages
- Mensajes de la aplicación
- Mensajes de apps nativas
- Video Library
- File Library

La app de cliente debe poder controlar:

- Menú superior
- Menú inferior
- Footer
- Vídeos
- Accordions
- Contenido
- Enlaces externos
- Páginas de sistema
- Draft/published
- Orden
- Ruta personalizada
- Tema por móvil/tablet/desktop
- Componentes visuales por página

## Herramientas

### Generador De Comidas

Inputs vistos:

- Preferencia de dieta
- Objetivo
- Comidas por día
- Número de días
- Altura
- Peso
- Grasa corporal
- Sistema métrico
- Edad
- Género
- Nivel de actividad
- Días vegetarianos
- Cocinas preferidas
- Recetas preferidas
- Alergias/no me gusta
- Comidas favoritas
- Comidas no gustadas

### Generador De Entrenamientos

Inputs vistos:

- Metas
- Sesión
- Género
- Semanas
- Días
- Program set
- Nivel de experiencia
- Ubicación
- Periodo
- Duración de periodo

### Push

Notificaciones programadas y únicas:

- Estado
- Nombre
- Delivery
- Tipo
- Secuencia

## Decisiones Para PerformLabs

Nuestra consola operativa debe tener estas capas:

1. Plataforma operativa: controla apps de cliente, plantillas globales y feature flags.
2. App de cliente: controla branding, dominio, contenido, productos, equipo y librerías clonadas.
3. Staff: gestiona clientes, planes, check-ins y soporte.
4. Miembro: consume app, planes y comunidad.

## Diferenciador

MacroActive está orientado a plataforma cerrada. PerformLabs debe ser:

- Propiedad nuestra.
- Supabase-first.
- Más editable.
- Multi-app desde el núcleo.
- Con plantillas globales heredables.
- Con trazabilidad de qué viene de la base compartida y qué modificó cada app de cliente.
