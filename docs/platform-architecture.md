# Arquitectura PerformLabs

PerformLabs funciona como una plataforma de implantacion para apps de coaching.
El objetivo no es duplicar codigo para cada cliente desde el primer dia, sino
mantener una base app robusta y parametrizable por marca, dominio, contenido,
roles y modulos activos.

## Plataforma Operativa

La consola central permite:

- Crear marcas y proyectos de implantacion.
- Activar o pausar apps de cliente.
- Coordinar dominios personalizados.
- Gestionar identidad visual, soporte y permisos.
- Preparar plantillas globales de ejercicios, dietas y contenido.
- Revisar metricas internas.
- Dar o quitar acceso a equipos.
- Dejar una app lista para vista cliente desde el briefing.

## App De Cliente

Cada app de cliente vive sobre la base PerformLabs y puede personalizar:

- Logo
- Colores
- Dominio
- Menu
- Textos
- Guias
- FAQs
- Videos de ejercicios
- Ejercicios propios
- Recetas propias
- Plantillas de dieta
- Plantillas de entrenamiento
- Precios y productos
- Equipo de coaches

## Base Compartida

La base app aporta:

- Pantallas moviles: panel, onboarding, entrenos, comidas, progreso, cardio, guias, soporte y perfil.
- Ajustes PWA por marca.
- Contenido inicial de bienvenida y soporte.
- Producto principal en borrador.
- Modulos de entrenamiento, nutricion, progreso y comunicacion.

Una marca puede personalizar sus datos sin romper la base comun. Si en una fase
posterior un cliente necesita despliegue aislado, se puede exportar su
configuracion y levantar una variante dedicada.

## Resolucion De Marca

El sistema debe detectar la marca por:

- Dominio publico del entrenador: `tumarca.com`
- Dominio de miembros: `miembros.tumarca.com`
- Subdominio PerformLabs de fallback: `marca-blanca.performlabs.app`
- Seleccion interna: `/app/select?brand=<workspace_id|slug|domain>`

La resolucion quirurgica completa queda documentada en
`docs/surgical-supabase-architecture.md`.

## Modelo De Dominios

Cada entrenador recibe una base generica de PerformLabs personalizada con lo justo:
branding, imagenes, textos, colores, contenido, programas, nutricion y dominio.

La separacion recomendada es:

- `public_domain`: web publica/comercial de la marca del entrenador.
  Ejemplo: `tumarca.com`.
- `member_domain`: app privada para miembros/clientes finales.
  Ejemplo: `miembros.tumarca.com`.
- `fallback_subdomain`: dominio tecnico mientras DNS o publicacion no estan listos.
  Ejemplo: `marca-blanca.performlabs.app`.

La consola del entrenador vive protegida por autenticacion y puede resolverse desde
la misma marca, pero nunca debe mezclarse con la experiencia del miembro final.
La consola interna PerformLabs sigue siendo `/console` y no se expone al cliente final.

## Permisos

- `platform_owner`: controla toda la plataforma.
- `agency_admin`: gestiona varias marcas.
- `coach_admin`: dueño operativo de una marca.
- `coach_staff`: equipo del entrenador.
- `member`: usuario final.

## Supabase

Supabase sera la fuente de verdad:

- Auth
- Postgres
- Storage
- Row Level Security
- Edge Functions para generacion de planes
- Realtime para chat/notificaciones

## Storage Buckets

- `exercise-videos`
- `recipe-media`
- `progress-photos`
- `brand-assets`
- `content-files`

Cada archivo debe llevar `workspace_id` o vivir en una ruta que lo incluya.
