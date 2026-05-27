# Arquitectura Madre / Apps Hijas

CoachOS es la plataforma madre. Cada entrenador, marca o agencia vive como una
app hija dentro de la misma infraestructura.

## Plataforma Madre

La madre tiene el mando supremo:

- Crear apps hijas.
- Activar o desactivar apps.
- Controlar dominios.
- Controlar planes y precios.
- Gestionar plantillas globales.
- Publicar librerías base de ejercicios.
- Publicar librerías base de dietas.
- Revisar métricas globales.
- Dar o quitar permisos.
- Clonar una app hija.
- Suspender una app hija por impago o mal uso.

## App Hija

Cada app hija pertenece a un entrenador o marca.

Puede modificar:

- Logo
- Colores
- Dominio
- Menú
- Textos
- Guías
- FAQs
- Vídeos de ejercicios
- Ejercicios propios
- Recetas propias
- Plantillas de dieta
- Plantillas de entrenamiento
- Precios y planes
- Equipo de coaches

## Herencia

Las apps hijas pueden heredar de la madre:

- Ejercicios base.
- Recetas base.
- Categorías de dieta.
- Fórmulas nutricionales.
- Plantillas de entrenamiento.
- Plantillas legales.
- Componentes de UI.

Una app hija puede clonar y modificar una plantilla sin alterar la plantilla madre.

## Resolución de Tenant

El sistema debe detectar la app hija por:

- Dominio propio: `app.entrenador.com`
- Subdominio: `entrenador.coachos.com`
- Slug interno: `/t/entrenador`

## Permisos

- `platform_owner`: mando supremo.
- `agency_admin`: gestiona varias apps hijas.
- `coach_admin`: dueño de una app hija.
- `coach_staff`: equipo del entrenador.
- `member`: usuario final.

## Supabase

Supabase será la fuente de verdad:

- Auth
- Postgres
- Storage
- Row Level Security
- Edge Functions para generación de planes
- Realtime para chat/notificaciones

## Storage Buckets

- `exercise-videos`
- `recipe-media`
- `progress-photos`
- `brand-assets`
- `content-files`

Cada archivo debe llevar `workspace_id` o vivir en una ruta que lo incluya.
